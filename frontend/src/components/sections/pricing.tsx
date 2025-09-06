"use client"

import React, { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, BookOpen, PenTool, GraduationCap, FileText } from "lucide-react"
import anime from "animejs"

export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: ".pricing-card",
              opacity: [0, 1],
              translateY: [50, 0],
              scale: [0.95, 1],
              delay: anime.stagger(150),
              duration: 700,
              easing: "easeOutQuart",
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])


  type Plan = {
    title: string
    price: string
    description: string
    icon: typeof BookOpen
    features: string[]
    period?: string
    popular?: boolean
  }

  const bookPublishingPlans: Plan[] = [
    {
      title: "Poem/Quote Book",
      price: "Starts from ₹1,499",
      period: " + GST",
      description: "Perfect for poetry collections and inspirational quotes",
      icon: PenTool,
      features: [
        "Professional formatting",
        "ISBN registration", 
        "Print-ready files",
        "Basic cover design",
        "Distribution setup"
      ],
    },
    {
      title: "Essays / Short Stories Book",
      price: "Starts from ₹1,499",
      period: " + GST",
      description: "Ideal for essay collections and short story compilations",
      icon: FileText,
      features: [
        "Professional formatting",
        "ISBN registration", 
        "Print-ready files",
        "Basic cover design",
        "Distribution setup"
      ],
    },
    {
      title: "Novel / Story Book",
      price: "Starts from ₹1,999",
      period: " + GST",
      description: "Complete novel and story book publishing package",
      icon: BookOpen,
      popular: true,
      features: [
        "Professional formatting",
        "ISBN registration",
        "Print-ready files", 
        "Enhanced cover design",
        "Distribution setup",
        "Marketing support"
      ],
    },
    {
      title: "Academic / Research Book",
      price: "Starts from ₹2,999",
      period: " + GST",
      description: "Specialized publishing for academic and research works",
      icon: GraduationCap,
      features: [
        "Academic formatting",
        "ISBN registration",
        "Print-ready files",
        "Professional cover design",
        "Distribution setup",
        "Citation formatting",
        "Index creation"
      ],
    },
  ]

  const getCurrentPlans = () => {
    return bookPublishingPlans
  }

  const currentPlans = getCurrentPlans()

  return (
    <section id="pricing" ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Book Publishing Rates
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional book publishing services tailored to your needs
          </p>
        </div>


        {
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {currentPlans.map((plan, index) => {
              const planId = `plan-${index}`
              const planPrice = plan.price
              const planPeriod = plan.period
              const planIcon = (plan as any).icon
              
              return (
                <Card
                  key={planId}
                  className={`pricing-card relative group hover:shadow-xl transition-all duration-300 ${
                    plan.popular ? "ring-2 ring-primary scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">Most Popular</Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mb-4 flex justify-center">
                      <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        {React.createElement(planIcon, { className: "h-8 w-8 text-primary" })}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {planPrice}
                      {planPeriod && <span className="text-sm text-muted-foreground">{planPeriod}</span>}
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        }

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            * All prices are starting rates and may vary based on specific requirements.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact us for custom packages and detailed quotations. GST applicable on all services.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Pricing