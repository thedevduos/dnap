import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RefundPolicy() {
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
            <h1 className="text-4xl font-bold text-primary mb-8">Cancellation & Refund Policy</h1>
            
            <div className="space-y-6 text-muted-foreground">
              <p>
                DNA Publications believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
              </p>

              <ul className="space-y-4 list-disc pl-6">
                <li>
                  Cancellations will be considered only if the request is made within 2 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.
                </li>

                <li>
                  DNA Publications does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
                </li>

                <li>
                  In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 2 days of receipt of the products.
                </li>

                <li>
                  In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 2 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.
                </li>

                <li>
                  In case of any Refunds approved by the DNA Publications, it'll take 3-5 days for the refund to be processed to the end customer.
                </li>
              </ul>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>For any questions regarding our refund policy, please contact our customer service team.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 