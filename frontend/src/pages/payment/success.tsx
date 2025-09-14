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
import { trackAffiliateSale } from "@/lib/author-utils"
import { processCompleteShiprocketOrder } from "@/lib/shiprocket-utils"
import { generateNextOrderNumber } from "@/lib/order-number-utils"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [adminEmailSent, setAdminEmailSent] = useState(false)
  const processedRef = useRef(false)
  const processingRef = useRef(false)
  const mountedRef = useRef(false)
  const effectRunRef = useRef(false)
  const { refreshCartItems } = useCart()
  const clearCartRef = useRef<any>(null)
  const toastRef = useRef<any>(null)
  const addAddressRef = useRef<any>(null)
  
  const { clearCart } = useCart()
  const { toast } = useToast()
  const { addAddress } = useUser()
  
  // Store refs to avoid dependency issues
  clearCartRef.current = clearCart
  toastRef.current = toast

  // Function to send order confirmation email with tracking information
  const sendOrderConfirmationEmailWithTracking = async (orderData: any, orderNumber: string, paymentMethod: string, paymentData: any, workflowResult: any) => {
    try {
      const emailData = {
        orderNumber: orderNumber,
        customerName: `${orderData.shippingAddress?.firstName} ${orderData.shippingAddress?.lastName}`,
        customerEmail: orderData.userEmail,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        total: orderData.total,
        shippingAddress: orderData.shippingAddress,
        transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                      paymentMethod === 'zoho' ? paymentData.paymentId : null,
        paymentMethod: paymentMethod,
        // Add tracking information if available
        trackingInfo: workflowResult ? {
          awbCode: workflowResult.courierResult?.awbCode,
          courierName: workflowResult.courierResult?.courierName,
          trackingUrl: workflowResult.courierResult?.trackingUrl,
          shiprocketOrderId: workflowResult.shiprocketOrderId,
          shipmentId: workflowResult.shipmentId,
          pickupGenerated: workflowResult.pickupResult?.success
        } : null
      }

      const emailResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/orders/send-order-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (emailResponse.ok) {
        console.log('✅ Order confirmation email sent successfully with tracking info')
      } else {
        console.warn('Failed to send order confirmation email:', await emailResponse.text())
      }
    } catch (emailError) {
      console.warn('Error sending order confirmation email:', emailError)
      // Don't throw error as the order was successful
    }
  }
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
          
          console.log('Stored order data found:', !!orderData)
          console.log('Order data details:', orderData ? {
            userId: orderData.userId,
            userEmail: orderData.userEmail,
            items: orderData.items?.length || 0,
            total: orderData.total,
            shippingAddress: orderData.shippingAddress
          } : null)
          
          if (orderData) {
              // Generate the next order number
              const orderNumber = await generateNextOrderNumber()
              
              // Handle regular book order
              const orderRef = await addDoc(collection(db, "orders"), {
                ...orderData,
                orderNumber: orderNumber, // Add the new order number
                transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                              paymentMethod === 'zoho' ? paymentData.paymentId : null,
                status: 'confirmed', // Update status to confirmed for successful payments
                createdAt: serverTimestamp()
              })

              // Create Shiprocket order if using Shiprocket shipping
              if (orderData.shippingMethod === 'shiprocket' && orderData.shippingMethodDetails?.courierId) {
                try {
                  console.log('Creating Shiprocket order for:', orderRef.id)
                  
                  // Refresh cart items to get latest book data (including SKU)
                  await refreshCartItems()
                  
                  console.log('Order data items for Shiprocket:', orderData.items);
                  
                  const shiprocketOrderData = {
                    orderId: orderNumber, // Use the DNAP/X format order number instead of Firebase ID
                    items: orderData.items,
                    shippingAddress: orderData.shippingAddress,
                    userEmail: orderData.userEmail,
                    subtotal: orderData.subtotal,
                    shipping: orderData.shipping,
                    total: orderData.total,
                    discount: orderData.discount,
                    paymentMethod: orderData.paymentMethod,
                    courierId: orderData.shippingMethodDetails.courierId
                  }

                  const workflowResult = await processCompleteShiprocketOrder(shiprocketOrderData)
                  
                  if (workflowResult.success) {
                    console.log('✅ Complete Shiprocket workflow successful:', {
                      orderId: workflowResult.shiprocketOrderId,
                      shipmentId: workflowResult.shipmentId,
                      workflow: workflowResult.workflow
                    })
                    
                    // Update order with Shiprocket details
                    const updateData: any = {
                      shiprocketOrderId: workflowResult.shiprocketOrderId,
                      shipmentId: workflowResult.shipmentId,
                      status: 'shipped'
                    }
                    
                    // Add courier details if assignment was successful
                    if (workflowResult.courierResult?.success) {
                      updateData.shiprocketAWB = workflowResult.courierResult.awbCode
                      updateData.courierName = workflowResult.courierResult.courierName
                      if (workflowResult.courierResult.trackingUrl) {
                        updateData.trackingUrl = workflowResult.courierResult.trackingUrl
                      }
                    }
                    
                    // Add pickup details if generation was successful
                    if (workflowResult.pickupResult?.success) {
                      updateData.pickupGenerated = true
                      updateData.pickupData = workflowResult.pickupResult.pickupData
                    }
                    
                    // Filter out undefined values before updating
                    const filteredUpdateData: any = Object.fromEntries(
                      Object.entries(updateData).filter(([_, value]) => value !== undefined)
                    )
                    
                    await updateDoc(orderRef, filteredUpdateData)
                    
                    console.log('✅ Order updated with complete Shiprocket workflow results')
                    
                    // Send order confirmation email ONLY after complete Shiprocket workflow is successful
                    await sendOrderConfirmationEmailWithTracking(orderData, orderNumber, paymentMethod, paymentData, workflowResult)
                    
                    // Send admin pickup notification email
                    try {
                      const emailUtils = await import('@/lib/email-utils')
                      await emailUtils.sendAdminPickupNotification(orderData, workflowResult.pickupResult?.pickupData, workflowResult.courierResult)
                      console.log('✅ Admin pickup notification email sent successfully')
                      setAdminEmailSent(true) // Enable buttons after admin email is sent
                    } catch (adminEmailError) {
                      console.error('Error sending admin pickup notification email:', adminEmailError)
                      // Don't throw error as the main workflow is complete
                      setAdminEmailSent(true) // Still enable buttons even if admin email fails
                    }
                  } else {
                    console.warn('⚠️ Complete Shiprocket workflow failed:', workflowResult.message)
                    
                    // Don't send email if Shiprocket workflow failed - wait for manual processing
                    console.log('❌ Not sending email due to failed Shiprocket workflow')
                    setAdminEmailSent(true) // Still enable buttons even if Shiprocket workflow failed
                  }
                } catch (shiprocketError) {
                  console.error('Error creating Shiprocket order:', shiprocketError)
                  // Don't throw error as the order was successful, just log the issue
                  
                  // Don't send email if Shiprocket workflow failed - wait for manual processing
                  console.log('❌ Not sending email due to Shiprocket error')
                  setAdminEmailSent(true) // Still enable buttons even if Shiprocket error occurs
                }
              } else {
                // For non-Shiprocket orders, send email immediately
                console.log('Non-Shiprocket order, sending confirmation email immediately')
                await sendOrderConfirmationEmailWithTracking(orderData, orderNumber, paymentMethod, paymentData, null)
                setAdminEmailSent(true) // Enable buttons for non-Shiprocket orders
              }

              // Track affiliate sale if applicable
              if (orderData.affiliateRef) {
                try {
                  console.log('Tracking affiliate sale:', {
                    affiliateRef: orderData.affiliateRef,
                    orderId: orderRef.id,
                    total: orderData.total
                  })
                  const result = await trackAffiliateSale(orderData.affiliateRef, orderRef.id, orderData.total)
                  console.log('Affiliate sale tracking result:', result)
                } catch (affiliateError) {
                  console.warn('Failed to track affiliate sale:', affiliateError)
                  // Don't throw error as the order was successful
                }
              } else {
                console.log('No affiliate ref found in order data:', orderData)
              }

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
              if (orderData.appliedCoupon && orderData.appliedCoupon.id) {
                try {
                  await applyCoupon(orderData.appliedCoupon.id, orderData.userId)
                } catch (couponError) {
                  console.warn('Failed to apply coupon usage:', couponError)
                  // Don't throw error as the payment was successful
                }
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
                orderNumber: orderNumber, // Include the new order number
                gatewayTransactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                                     paymentMethod === 'zoho' ? paymentData.paymentId : null,
                amount: parseFloat(paymentData.amount || '0'),
                status: 'success',
                paymentMethod: paymentMethod,
                customerName: orderData.shippingAddress?.firstName + ' ' + orderData.shippingAddress?.lastName,
                customerEmail: orderData.userEmail,
                paymentMode: 'online'
              })

              // Email will be sent after Shiprocket workflow completion (if applicable)

              setOrderDetails({
                orderId: orderRef.id,
                orderNumber: orderNumber, // Include the new order number
                amount: orderData.total,
                transactionId: paymentMethod === 'razorpay' ? paymentData.razorpay_payment_id : 
                              paymentMethod === 'zoho' ? paymentData.paymentId : null,
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
              
              {!adminEmailSent && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-blue-900 font-medium text-sm mb-1">
                        Finalizing your order...
                      </h3>
                      <p className="text-blue-700 text-sm leading-relaxed">
                        We're processing your order and notifying our team about the pickup schedule. 
                        This will only take a moment.
                      </p>
                      <div className="mt-3 flex items-center text-blue-600 text-xs">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Please don't go back or refresh the page
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {orderDetails && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order Number:</span>
                      <span className="font-mono">{orderDetails.orderNumber || 'N/A'}</span>
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
                <Button 
                  asChild 
                  size="lg" 
                  className={`w-full transition-all duration-200 ${
                    !adminEmailSent 
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500' 
                      : 'hover:shadow-md'
                  }`}
                  disabled={!adminEmailSent}
                >
                  <Link to={orderDetails ? `/order/${orderDetails.orderId}` : "/profile"}>
                    {!adminEmailSent ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Package className="w-5 h-5 mr-2" />
                        View Order Details
                      </>
                    )}
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  asChild 
                  className={`w-full transition-all duration-200 ${
                    !adminEmailSent 
                      ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-500' 
                      : 'hover:shadow-md'
                  }`}
                  disabled={!adminEmailSent}
                >
                  <Link to="/books">
                    {!adminEmailSent ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        Continue Shopping
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Link>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {false ? (
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