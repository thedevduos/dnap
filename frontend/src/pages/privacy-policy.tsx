import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl font-bold text-primary mb-8">Privacy Policy</h1>
            
            <div className="space-y-6 text-muted-foreground">
              <p>
                Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our website.
              </p>

              <p>
                We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
              </p>

              <p>
                We don't share any personally identifying information publicly or with third-parties, except when required to by law.
              </p>

              <p>
                Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites and cannot accept responsibility or liability for their respective privacy policies.
              </p>

              <p>
                You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.
              </p>

              <p>
                Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.
              </p>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>This policy is effective as of 1 February 2024.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 