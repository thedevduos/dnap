"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [_orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    const error = searchParams.get('error') || 'Payment was unsuccessful'
    
    // Get stored order data but don't clear it yet
    const storedOrderData = sessionStorage.getItem('pendingOrderData')
    if (storedOrderData) {
      setOrderData(JSON.parse(storedOrderData))
    }
    
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    })
  }, [searchParams, toast])

  const handleTryAgain = () => {
    // Navigate back to checkout with preserved order data
    navigate('/checkout')
  }

  const handleBackToCart = () => {
    // Clear order data and cart when user chooses to go back to cart
    sessionStorage.removeItem('pendingOrderData')
    clearCart()
    navigate('/cart')
  }

  const txnid = searchParams.get('txnid')
  const orderId = txnid?.split('_')[1]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                We're sorry, but your payment could not be processed. Please try again or use a different payment method.
              </p>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Common reasons for payment failure:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Insufficient funds in your account</li>
                  <li>• Incorrect card details</li>
                  <li>• Network connectivity issues</li>
                  <li>• Bank security restrictions</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button onClick={handleTryAgain} size="lg" className="w-full">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </Button>
                
                <Button variant="outline" onClick={handleBackToCart} className="w-full">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Cart
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Need help? Contact our support team at info@dnap.in</p>
                {orderId && (
                  <p className="mt-2">Reference Order ID: #{orderId.slice(-8)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}