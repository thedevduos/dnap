"use client"

import { useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const error = searchParams.get('error') || 'Payment was unsuccessful'
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    })
  }, [searchParams, toast])

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
                <Button asChild size="lg" className="w-full">
                  <Link to="/checkout">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link to="/cart">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Cart
                  </Link>
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Need help? Contact our support team at support@dnapublications.com</p>
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