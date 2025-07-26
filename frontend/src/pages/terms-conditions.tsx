import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsConditions() {
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
            <h1 className="text-4xl font-bold text-primary mb-8">Terms & Conditions</h1>
            
            <div className="space-y-6 text-muted-foreground">
              <p>
                For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean DNA Publications, whose registered/operational office is 4 147, Perumal Kovil Street, Uppukottai Theni TAMIL NADU 625534. "you", "your", "user", "visitor" shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
              </p>

              <p>
                Your use of the website and/or purchase from us are governed by following Terms and Conditions:
              </p>

              <ul className="space-y-4 list-disc pl-6">
                <li>
                  The content of the pages of this website is subject to change without notice.
                </li>

                <li>
                  Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
                </li>

                <li>
                  Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.
                </li>

                <li>
                  Our website and/or product pages contains material which is owned by or licensed to us. This material includes, but are not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.
                </li>

                <li>
                  All trademarks reproduced in our website and/or product pages which are not the property of, or licensed to, the operator are acknowledged on the website and/or product pages.
                </li>

                <li>
                  Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.
                </li>

                <li>
                  From time to time our website and/or product pages may also include links to other websites. These links are provided for your convenience to provide further information.
                </li>

                <li>
                  You may not create a link to our website and/or product pages from another website or document without DNA Publications's prior written consent.
                </li>

                <li>
                  Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India.
                </li>

                <li>
                  We, shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.
                </li>
              </ul>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>For questions regarding these terms and conditions, please contact our legal team.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 