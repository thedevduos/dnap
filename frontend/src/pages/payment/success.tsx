"use client"

import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { updateOrderStatus, addTransaction } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const { clearCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const paymentData = {
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

        // Verify payment with backend
        const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        })

        const verifyResult = await verifyResponse.json()

        if (verifyResult.success && verifyResult.data.success) {
          // Extract order ID from txnid
          const orderId = paymentData.txnid?.split('_')[1]
          
          if (orderId) {
            // Update order status
            await updateOrderStatus(orderId, 'confirmed', {
              paymentStatus: 'paid',
              transactionId: paymentData.mihpayid,
              paymentMode: paymentData.mode
            })

            // Add transaction record
            await addTransaction({
              orderId: orderId,
              gatewayTransactionId: paymentData.mihpayid,
              amount: parseFloat(paymentData.amount || '0'),
              status: 'success',
              paymentMethod: 'payu',
              customerName: paymentData.firstname,
              customerEmail: paymentData.email,
              paymentMode: paymentData.mode
            })

            setOrderDetails({
              orderId,
              amount: paymentData.amount,
              transactionId: paymentData.mihpayid
            })

            // Clear cart
            clearCart()

            toast({
              title: "Payment Successful!",
              description: "Your order has been confirmed.",
            })
          }
        } else {
          throw new Error('Payment verification failed')
        }

      } catch (error) {
        console.error('Payment processing error:', error)
        toast({
          title: "Payment Error",
          description: "There was an issue processing your payment.",
          variant: "destructive",
        })
      } finally {
        setProcessing(false)
      }
    }

    processPaymentSuccess()
  }, [searchParams, clearCart, toast])

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
                  <Link to="/shop">
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