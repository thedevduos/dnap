import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-primary mb-8">Shipping Policy</h1>
            
            <div className="space-y-6 text-muted-foreground">
              <p>
                For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only. For domestic buyers, orders are shipped through registered domestic courier companies and /or speed post only.
              </p>

              <p>
                Orders are shipped within 0-7 days or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company / post office norms.
              </p>

              <p>
                DNA Publications is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 0-7 days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
              </p>

              <p>
                Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration.
              </p>

              <p>
                For any issues in utilizing our services you may contact our helpdesk.
              </p>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>For shipping inquiries or support, please contact our customer service team.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 