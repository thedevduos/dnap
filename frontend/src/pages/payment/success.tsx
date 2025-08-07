"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useEbookCart } from "@/contexts/ebook-cart-context"
import { updateOrderStatus, addTransaction, processRefund } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useUser } from "@/contexts/user-context"
import { applyCoupon } from "@/lib/firebase-utils"
import { verifyPaymentResponse, getPaymentMethodDisplayName, getOrderData, clearOrderData } from "@/lib/payment-utils"
import { createEbookSubscription, createEbookOrder } from "@/lib/ebook-utils"

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
  const { clearCart: clearEbookCart } = useEbookCart()
  const { toast } = useToast()
  const { addAddress } = useUser()
  
  // Store refs to avoid dependency issues
  clearCartRef.current = clearCart
  toastRef.current = toast
  addAddressRef.current = addAddress

  useEffect(() => {
    // Check if this effect has already run for this payment session
    const effectRunFlag = sessionStorage.getItem('successPageEffectRun')
    
    // Check if we have fresh payment data that should trigger reprocessing
    const paymentMethod = searchParams.get('method') || 'razorpay'
    let hasFreshPaymentData = false
    
    if (paymentMethod === 'zoho') {
      const paymentId = searchParams.get('payment_id')
      hasFreshPaymentData = !!paymentId
    } else if (paymentMethod === 'razorpay') {
      const razorpayResponse = sessionStorage.getItem('razorpayResponse')
      hasFreshPaymentData = !!razorpayResponse
    }
    
    // If we have fresh payment data, clear the effect run flag to allow reprocessing
    if (hasFreshPaymentData && effectRunFlag) {
      console.log('Fresh payment data detected, clearing effect run flag for reprocessing...')
      sessionStorage.removeItem('successPageEffectRun')
    }
    
    const updatedEffectRunFlag = sessionStorage.getItem('successPageEffectRun')
    if (updatedEffectRunFlag) {
      console.log('Effect already run for this payment session, skipping...')
      setProcessing(false)
      return
    }

    // Prevent multiple processing attempts - use a more robust approach
    if (effectRunRef.current) {
      console.log('Effect already run, skipping...')
      setProcessing(false)
      return
    }

    effectRunRef.current = true
    
    // Prevent multiple processing attempts
    if (processedRef.current || processingRef.current || mountedRef.current) {
      console.log('Payment already processed, currently processing, or component already mounted, skipping...')
      setProcessing(false)
      return
    }

    mountedRef.current = true
    
    // Clear any existing payment processed flag on mount to ensure fresh processing
    sessionStorage.removeItem('paymentProcessed')
    
    // Check if we have payment data to process
    let hasPaymentData = false
    
    if (paymentMethod === 'razorpay') {
      const razorpayResponse = sessionStorage.getItem('razorpayResponse')
      hasPaymentData = !!razorpayResponse
    } else if (paymentMethod === 'zoho') {
      const paymentId = searchParams.get('payment_id')
      const sessionId = searchParams.get('session_id')
      const storedSessionData = sessionStorage.getItem('zoho_payment_session')
      hasPaymentData = !!(paymentId || (sessionId && storedSessionData))
    }
    
    if (!hasPaymentData) {
      console.log('No payment data found, skipping...')
      setProcessing(false)
      return
    }

    // Mark that this effect has run
    sessionStorage.setItem('successPageEffectRun', 'true')
    
    console.log('Starting payment processing...')
    processingRef.current = true
    const processPaymentSuccess = async () => {
      try {
        // Get payment method from URL params or session storage
        const paymentMethod = searchParams.get('method') || 'razorpay'
        
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

        } else if (paymentMethod === 'zoho') {
          // Handle Zoho Pay response
          const paymentId = searchParams.get('payment_id')
          const sessionId = searchParams.get('session_id')
          
          // Get stored session data
          const storedSessionData = sessionStorage.getItem('zoho_payment_session')
          
          if (paymentId) {
            // Payment ID provided in URL (from Zoho redirect)
            paymentData = { paymentId }
            verificationResult = await verifyPaymentResponse(paymentData, 'zoho')
          } else if (sessionId && storedSessionData) {
            // Session ID provided, verify the payment using session data
            const sessionData = JSON.parse(storedSessionData)
            paymentData = { 
              sessionId,
              paymentId: sessionId, // Use session ID as payment ID for verification
              ...sessionData
            }
            verificationResult = await verifyPaymentResponse(paymentData, 'zoho')
          } else {
            throw new Error('Zoho Pay payment ID or session ID not found')
          }

        } else {
          // Handle unknown payment method
          throw new Error(`Unsupported payment method: ${paymentMethod}`)
        }

        // Log payment data for debugging
        console.log('Payment Data received:', paymentData)
        console.log('Verification result:', verificationResult)

        // Check if payment was successful
        const isPaymentSuccessful = verificationResult?.success || 
                                   paymentData.status === 'success' || 
                                   paymentData.unmappedstatus === 'userCancelled' ||
                                   (paymentMethod === 'zoho' && verificationResult?.status === 'success')

        // Check if an order with this transaction ID already exists
        const transactionId = paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                            paymentMethod === 'zoho' ? paymentData.paymentId : null
        
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
          
          // Check if this is an ebook order
          const isEbookOrder = orderData?.isEbookOrder
          
          console.log('Stored order data found:', !!orderData)
          console.log('Order data details:', orderData ? {
            userId: orderData.userId,
            userEmail: orderData.userEmail,
            items: orderData.items?.length || 0,
            total: orderData.total,
            amount: orderData.amount, // Add amount field for ebook orders
            planId: orderData.planId, // Add plan fields for ebook orders
            planTitle: orderData.planTitle,
            shippingAddress: orderData.shippingAddress,
            isEbookOrder: isEbookOrder
          } : null)
          
          if (orderData) {
            if (isEbookOrder) {
              // Validate required fields for ebook orders
              if (!orderData.amount && !orderData.total) {
                throw new Error('Order amount is missing for ebook order')
              }
              
              const orderAmount = orderData.amount || orderData.total
              
              // Handle e-book subscription order
              const ebookOrderRef = await createEbookOrder({
                userId: orderData.userId,
                planId: orderData.planId,
                planTitle: orderData.planTitle,
                amount: orderAmount,
                paymentMethod: paymentMethod,
                transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                              paymentMethod === 'zoho' ? paymentData.paymentId : null,
                status: 'confirmed',
                createdAt: new Date()
              })

              // Calculate subscription dates
              const startDate = new Date()
              const endDate = new Date()
              endDate.setDate(endDate.getDate() + (orderData.duration || 30)) // Default to 30 days if duration not specified

              // Create e-book subscription
              const subscriptionRef = await createEbookSubscription({
                userId: orderData.userId,
                planId: orderData.planId,
                planTitle: orderData.planTitle,
                planType: orderData.planType,
                selectedBooks: [],
                maxBooks: orderData.maxBooks,
                startDate: startDate,
                endDate: endDate,
                status: 'active',
                autoRenew: false,
                isConfigured: false, // New subscriptions need book selection
                createdAt: new Date(),
                updatedAt: new Date()
              })

              setOrderDetails({
                orderId: ebookOrderRef.id,
                amount: orderAmount,
                transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                              paymentMethod === 'zoho' ? paymentData.paymentId : null,
                paymentMethod: paymentMethod,
                isEbookOrder: true,
                subscriptionId: subscriptionRef.id
              })
            } else {
              // Handle regular book order
              const orderRef = await addDoc(collection(db, "orders"), {
                ...orderData,
                transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                              paymentMethod === 'zoho' ? paymentData.paymentId : null,
                createdAt: serverTimestamp()
              })

              // Update customer's order count and total spent
              if (orderData.userId) {
                const userProfileRef = doc(db, "userProfiles", orderData.userId)
                await updateDoc(userProfileRef, {
                  orderCount: increment(1),
                  totalSpent: increment(orderData.total),
                  updatedAt: serverTimestamp()
                })
              }

              // Apply coupon usage
              if (orderData.appliedCoupon) {
                await applyCoupon(orderData.appliedCoupon.id, orderData.userId)
              }

              // Update order status
              await updateOrderStatus(orderRef.id, 'confirmed', {
                paymentStatus: 'paid',
                transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                              paymentMethod === 'zoho' ? paymentData.paymentId : null,
                paymentMode: 'online',
                paymentMethod: paymentMethod
              })

              // Add transaction record
              await addTransaction({
                orderId: orderRef.id,
                gatewayTransactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                                     paymentMethod === 'zoho' ? paymentData.paymentId : null,
                amount: parseFloat(paymentData.amount || '0'),
                status: 'success',
                paymentMethod: paymentMethod,
                customerName: orderData.shippingAddress?.firstName + ' ' + orderData.shippingAddress?.lastName,
                customerEmail: orderData.userEmail,
                paymentMode: 'online'
              })

              setOrderDetails({
                orderId: orderRef.id,
                amount: orderData.total,
                transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                              paymentMethod === 'zoho' ? paymentData.paymentId : null,
                paymentMethod: paymentMethod
              })
            }

            // Clear cart first
            clearCartRef.current()
            clearEbookCart()

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
        const paymentMethod = searchParams.get('method') || 'razorpay'
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
          <p className="text-muted-foreground mb-4">Processing your payment...</p>
          <Button 
            variant="outline" 
            onClick={() => {
              // Clear all flags and retry
              sessionStorage.removeItem('successPageEffectRun')
              sessionStorage.removeItem('paymentProcessed')
              sessionStorage.removeItem('paymentProcessing')
              processedRef.current = false
              processingRef.current = false
              mountedRef.current = false
              effectRunRef.current = false
              setProcessing(false)
              // Force a page reload to retry
              window.location.reload()
            }}
          >
            Retry Processing
          </Button>
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
                  <Link to={orderDetails?.isEbookOrder ? "/ebooks" : orderDetails ? `/order/${orderDetails.orderId}` : "/profile"}>
                    <Package className="w-5 h-5 mr-2" />
                    {orderDetails?.isEbookOrder ? "View My E-books" : "View Order Details"}
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link to={orderDetails?.isEbookOrder ? "/my-books" : "/books"}>
                    {orderDetails?.isEbookOrder ? "Start Reading" : "Continue Shopping"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {orderDetails?.isEbookOrder ? (
                  <>
                    <p>Your e-book subscription is now active!</p>
                    <p>Start reading your selected books immediately.</p>
                  </>
                ) : (
                  <>
                    <p>You will receive an email confirmation shortly.</p>
                    <p>We'll notify you when your order ships.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}