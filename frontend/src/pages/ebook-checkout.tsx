"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, BookOpen, Clock, Users } from "lucide-react"
import { useEbookCart } from "@/contexts/ebook-cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { 
  handleRazorpayPayment, 
  handleZohoPayment,
  getPaymentMethodDisplayName,
  getPaymentMethodDescription,
  storeEbookOrderData,
  clearOrderData
} from "@/lib/payment-utils"

export default function EbookCheckoutPage() {
  const { items, getTotalPrice, clearCart } = useEbookCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [processing, setProcessing] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      navigate('/pricing')
      return
    }
  }, [items, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (processing || paymentProcessing) {
      return
    }
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to complete your purchase",
        variant: "destructive"
      })
      navigate('/auth/login')
      return
    }

    if (items.length === 0) {
      toast({
        title: "No Plans Selected",
        description: "Please select an e-book plan to continue",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    setPaymentProcessing(true)

    try {
      // For now, handle single plan purchase (can be extended for multiple plans)
      const selectedPlan = items[0].plan
      
      // Store e-book order data
      storeEbookOrderData(selectedPlan, user.uid)
      
      // Set payment processing flag
      sessionStorage.setItem('paymentProcessing', 'true')
      
      // Create temporary order ID
      const tempOrderId = `EBOOK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const paymentData = {
        orderId: tempOrderId,
        amount: selectedPlan.price,
        customerName: user.displayName || user.email?.split('@')[0] || 'User',
        customerEmail: user.email || '',
        customerPhone: '',
        productInfo: `DNA Publications E-book Plan - ${selectedPlan.title}`
      }

      switch (paymentMethod) {
        case 'razorpay':
          await handleRazorpayPayment(paymentData)
          break
        case 'zoho':
          await handleZohoPayment(paymentData)
          break
        default:
          throw new Error('Unsupported payment method')
      }

    } catch (error: any) {
      console.error('E-book checkout error:', error)
      
      if (!paymentProcessing) {
        clearOrderData()
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
      setPaymentProcessing(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  const selectedPlan = items[0].plan

  return (
    <div className="min-h-screen bg-background relative">
      {/* Loading Overlay */}
      {paymentProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">Please wait while we process your e-book subscription...</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">E-book Subscription Checkout</h1>

        <form onSubmit={handleSubmit} className={paymentProcessing ? 'pointer-events-none opacity-50' : ''}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Method */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1">
                        <div>
                          <p className="font-medium">{getPaymentMethodDisplayName('razorpay')}</p>
                          <p className="text-sm text-muted-foreground">
                            {getPaymentMethodDescription('razorpay')}
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="zoho" id="zoho" />
                      <Label htmlFor="zoho" className="flex-1">
                        <div>
                          <p className="font-medium">{getPaymentMethodDisplayName('zoho')}</p>
                          <p className="text-sm text-muted-foreground">
                            {getPaymentMethodDescription('zoho')}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Subscription Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Plan Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{selectedPlan.title}</h3>
                        <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="mr-2">
                        {selectedPlan.type === 'single' ? 'Single E-book' : 'Multiple E-books'}
                      </Badge>
                      {selectedPlan.maxBooks && (
                        <Badge variant="secondary">
                          Up to {selectedPlan.maxBooks} books
                        </Badge>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center text-sm text-blue-800">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Duration: {selectedPlan.duration} days</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div>
                    <h4 className="font-medium mb-2">Plan Features:</h4>
                    <ul className="space-y-1">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Plan Price</span>
                      <span>₹{selectedPlan.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (GST 18%)</span>
                      <span>₹{Math.round(selectedPlan.price * 0.18)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{selectedPlan.price + Math.round(selectedPlan.price * 0.18)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full" 
                    disabled={processing || paymentProcessing}
                  >
                    {processing || paymentProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {paymentProcessing ? `Redirecting to ${getPaymentMethodDisplayName(paymentMethod)}...` : "Processing..."}
                      </div>
                    ) : (
                      `Subscribe for ₹${selectedPlan.price + Math.round(selectedPlan.price * 0.18)}`
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}