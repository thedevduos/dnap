"use client"

import { useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const { clearCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    // Clear cart for demo orders after successful payment
    clearCart()
    
    toast({
      title: "Order Confirmed!",
      description: "Your order has been placed successfully.",
    })
  }, [clearCart, toast])

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
              <CardTitle className="text-2xl text-green-600">Order Confirmed!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order has been confirmed and will be processed shortly.
              </p>

              {id && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">#{id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-semibold text-green-600">Confirmed</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button asChild size="lg" className="w-full">
                  <Link to="/profile">
                    <Package className="w-5 h-5 mr-2" />
                    View My Orders
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