"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { updateOrderStatus, addTransaction, processRefund } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useUser } from "@/contexts/user-context"
import { applyCoupon } from "@/lib/firebase-utils"
import { verifyPaymentResponse, getPaymentMethodDisplayName, getOrderData, clearOrderData } from "@/lib/payment-utils"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const processedRef = useRef(false)
  const processingRef = useRef(false)
  const mountedRef = useRef(false)
  const effectRunRef = useRef(false)
  const clearCartRef = useRef<any>(null)
  const toastRef = useRef<any>(null)
  const addAddressRef = useRef<any>(null)
  
  const { clearCart } = useCart()
  const { toast } = useToast()
  const { addAddress } = useUser()
  
  // Store refs to avoid dependency issues
  clearCartRef.current = clearCart
  toastRef.current = toast
  addAddressRef.current = addAddress

  useEffect(() => {
    // Check if this effect has already run for this payment session
    const effectRunFlag = sessionStorage.getItem('successPageEffectRun')
    if (effectRunFlag) {
      console.log('Effect already run for this payment session, skipping...')
      return
    }

    // Mark that this effect has run
    sessionStorage.setItem('successPageEffectRun', 'true')
    
    // Prevent multiple processing attempts - use a more robust approach
    if (effectRunRef.current) {
      console.log('Effect already run, skipping...')
      return
    }

    effectRunRef.current = true
    
    // Prevent multiple processing attempts
    if (processedRef.current || processingRef.current || mountedRef.current) {
      console.log('Payment already processed, currently processing, or component already mounted, skipping...')
      return
    }

    mountedRef.current = true
    
    // Clear any existing payment processed flag on mount to ensure fresh processing
    sessionStorage.removeItem('paymentProcessed')
    
    // Additional check: if we've already processed this payment, skip
    const paymentMethod = searchParams.get('method') || 'payu'
    if (paymentMethod === 'razorpay') {
      const razorpayResponse = sessionStorage.getItem('razorpayResponse')
      if (!razorpayResponse) {
        console.log('No Razorpay response found, skipping...')
        setProcessing(false)
        return
      }
    }

    console.log('Starting payment processing...')
    processingRef.current = true
    const processPaymentSuccess = async () => {
      try {
        // Get payment method from URL params or session storage
        const paymentMethod = searchParams.get('method') || 'payu'
        
        let paymentData: any = {}
        let verificationResult: any = null

        if (paymentMethod === 'razorpay') {
          // Get Razorpay response from session storage
          const razorpayResponse = sessionStorage.getItem('razorpayResponse')
          if (razorpayResponse) {
            paymentData = JSON.parse(razorpayResponse)
            verificationResult = await verifyPaymentResponse(paymentData, 'razorpay')
            // Don't remove razorpayResponse yet - we'll remove it after successful processing
          } else {
            throw new Error('Razorpay payment data not found')
          }

        } else {
          // Handle PayU response
          paymentData = {
            mihpayid: searchParams.get('mihpayid'),
            mode: searchParams.get('mode'),
            status: searchParams.get('status'),
            unmappedstatus: searchParams.get('unmappedstatus'),
            key: searchParams.get('key'),
            txnid: searchParams.get('txnid'),
            amount: searchParams.get('amount'),
            productinfo: searchParams.get('productinfo'),
            firstname: searchParams.get('firstname'),
            email: searchParams.get('email'),
            hash: searchParams.get('hash')
          }
          verificationResult = await verifyPaymentResponse(paymentData, 'payu')
        }

        // Log payment data for debugging
        console.log('Payment Data received:', paymentData)
        console.log('Verification result:', verificationResult)

        // Check if payment was successful
        const isPaymentSuccessful = verificationResult?.success || 
                                   paymentData.status === 'success' || 
                                   paymentData.unmappedstatus === 'userCancelled'

        // Check if an order with this transaction ID already exists
        const transactionId = paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                            paymentData.mihpayid
        
        if (transactionId) {
          const existingOrderQuery = query(
            collection(db, "orders"),
            where("transactionId", "==", transactionId)
          )
          const existingOrderSnapshot = await getDocs(existingOrderQuery)
          
          if (!existingOrderSnapshot.empty) {
            console.log('Order with this transaction ID already exists, skipping...')
            const existingOrder = existingOrderSnapshot.docs[0]
            setOrderDetails({
              orderId: existingOrder.id,
              amount: existingOrder.data().total || paymentData.amount,
              transactionId: transactionId,
              paymentMethod: paymentMethod
            })
            setProcessing(false)
            processedRef.current = true
            return
          }
        }

        if (isPaymentSuccessful) {
          // Get stored order data from sessionStorage
          const orderData = getOrderData()
          console.log('Stored order data found:', !!orderData)
          console.log('Order data details:', orderData ? {
            userId: orderData.userId,
            userEmail: orderData.userEmail,
            items: orderData.items?.length || 0,
            total: orderData.total,
            shippingAddress: orderData.shippingAddress
          } : null)
          
          // Debug: Check what's in sessionStorage
          console.log('All sessionStorage keys:', Object.keys(sessionStorage))
          console.log('pendingOrderData in sessionStorage:', sessionStorage.getItem('pendingOrderData'))
          console.log('paymentProcessing flag:', sessionStorage.getItem('paymentProcessing'))
          
          if (orderData) {
            console.log('Parsed order data:', orderData)
            
            // Create the actual order in database
            const orderRef = await addDoc(collection(db, "orders"), {
              ...orderData,
              transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                            paymentData.mihpayid,
              createdAt: serverTimestamp()
            })

            // Update customer's order count and total spent
            if (orderData.userId) {
              // Update user profile with order information
              const userProfileRef = doc(db, "userProfiles", orderData.userId)
              await updateDoc(userProfileRef, {
                orderCount: increment(1),
                totalSpent: increment(orderData.total),
                updatedAt: serverTimestamp()
              })
            } else {
              // For guest users, try to find customer by email and update
              try {
                const customerQuery = query(
                  collection(db, "userProfiles"), 
                  where("email", "==", orderData.userEmail)
                )
                const customerSnapshot = await getDocs(customerQuery)
                if (!customerSnapshot.empty) {
                  const customerDoc = customerSnapshot.docs[0]
                  await updateDoc(doc(db, "userProfiles", customerDoc.id), {
                    orderCount: increment(1),
                    totalSpent: increment(orderData.total),
                    updatedAt: serverTimestamp()
                  })
                }
              } catch (error) {
                console.warn("Failed to update customer order count:", error)
              }
            }

            // Apply coupon usage
            if (orderData.appliedCoupon) {
              await applyCoupon(orderData.appliedCoupon.id, orderData.userId)
            }

            // Address is already saved before payment, so no need to save again
            if (orderData.saveAddress) {
              console.log('Address was already saved before payment')
            }

            // Update order status
            await updateOrderStatus(orderRef.id, 'confirmed', {
              paymentStatus: 'paid',
              transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                            paymentData.mihpayid,
              paymentMode: paymentMethod === 'razorpay' ? 'online' :
                          paymentData.mode,
              paymentMethod: paymentMethod
            })

            // Add transaction record
            await addTransaction({
              orderId: orderRef.id,
              gatewayTransactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                                   paymentData.mihpayid,
              amount: parseFloat(paymentData.amount || '0'),
              status: 'success',
              paymentMethod: paymentMethod,
              customerName: paymentMethod === 'razorpay' ? orderData.shippingAddress.firstName + ' ' + orderData.shippingAddress.lastName :
                           paymentData.firstname,
              customerEmail: paymentMethod === 'razorpay' ? orderData.userEmail :
                            paymentData.email,
              paymentMode: paymentMethod === 'razorpay' ? 'online' :
                          paymentData.mode
            })

            setOrderDetails({
              orderId: orderRef.id,
              amount: orderData.total,
              transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                            paymentData.mihpayid,
              paymentMethod: paymentMethod
            })

            // Clear cart first
            clearCartRef.current()

            // Now remove the razorpay response since processing is complete
            if (paymentMethod === 'razorpay') {
              sessionStorage.removeItem('razorpayResponse')
            }

            // Clear stored order data last
            clearOrderData()
            
            // Clear payment processing flag
            sessionStorage.removeItem('paymentProcessing')

            toastRef.current({
              title: "Payment Successful!",
              description: "Your order has been confirmed.",
            })
          } else {
            // If order data is not found, throw an error
            console.error('Order data not found in sessionStorage. Cannot create order without complete data.')
            throw new Error('Order data not found. Please try again or contact support.')
          }
        } else {
          throw new Error('Payment verification failed')
        }

        // Mark as processed to prevent multiple attempts
        console.log('Payment processing completed successfully')
        processedRef.current = true
        processingRef.current = false
        sessionStorage.setItem('paymentProcessed', 'true')

      } catch (error: any) {
        console.error('Payment processing error:', error)
        
        if ((orderDetails?.transactionId || orderDetails?.gatewayTransactionId) && orderDetails?.total > 0) {
          const txnId = orderDetails.gatewayTransactionId || orderDetails.transactionId
          await processRefund(txnId, orderDetails.total, orderDetails.paymentMethod)
          toastRef.current({
            title: "Payment Verification Error",
            description: "Payment verification failed. Please contact support.",
            variant: "destructive",
          })
        } else {
          toastRef.current({
            title: "Payment Error",
            description: "There was an issue processing your payment.",
            variant: "destructive",
          })
        }
        
        // Mark as processed even on error to prevent infinite retries
        console.log('Payment processing completed with error')
        processedRef.current = true
        processingRef.current = false
        sessionStorage.setItem('paymentProcessed', 'true')
        
        // Remove razorpay response on error as well
        const paymentMethod = searchParams.get('method') || 'payu'
        if (paymentMethod === 'razorpay') {
          sessionStorage.removeItem('razorpayResponse')
        }
        
        // Clear payment processing flag on error as well
        sessionStorage.removeItem('paymentProcessing')
      } finally {
        setProcessing(false)
      }
    }

    processPaymentSuccess()

    // Cleanup function to clear the processed flag when component unmounts
    return () => {
      sessionStorage.removeItem('paymentProcessed')
      sessionStorage.removeItem('paymentProcessing')
      sessionStorage.removeItem('successPageEffectRun')
      mountedRef.current = false
      effectRunRef.current = false
    }
      }, []) // Empty dependency array to ensure effect runs only once

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order has been confirmed and will be processed shortly.
              </p>

              {orderDetails && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">#{orderDetails.orderId.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-semibold">₹{orderDetails.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction ID:</span>
                      <span className="font-mono text-xs">{orderDetails.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-semibold">{getPaymentMethodDisplayName(orderDetails.paymentMethod)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button asChild size="lg" className="w-full">
                  <Link to={orderDetails ? `/order/${orderDetails.orderId}` : "/profile"}>
                    <Package className="w-5 h-5 mr-2" />
                    View Order Details
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link to="/books">
                    Continue Shopping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>You will receive an email confirmation shortly.</p>
                <p>We'll notify you when your order ships.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}