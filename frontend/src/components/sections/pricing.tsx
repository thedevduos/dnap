"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown, Infinity } from "lucide-react"
import anime from "animejs"

export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeTab, setActiveTab] = useState<"ebooks" | "subscription" | "publishing">("ebooks")

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
    icon: typeof Star
    features: string[]
    period?: string
    popular?: boolean
  }

  const ebookPlans: Plan[] = [
    {
      title: "Single Ebook",
      price: "₹99 - ₹399",
      description: "Per title purchase",
      icon: Star,
      features: ["Instant download", "Multiple formats (PDF, EPUB)", "Offline reading", "Customer support"],
    },
  ]

  const subscriptionPlans: Plan[] = [
    {
      title: "Monthly",
      price: "₹169",
      period: "/month",
      description: "Perfect for casual readers",
      icon: Zap,
      features: ["Access to entire library", "New releases included", "Offline downloads", "Cancel anytime"],
    },
    {
      title: "Quarterly",
      price: "₹799",
      period: "/3 months",
      description: "Best value for regular readers",
      icon: Crown,
      popular: true,
      features: [
        "Everything in Monthly",
        "Priority customer support",
        "Early access to new releases",
        "Exclusive author interviews",
      ],
    },
    {
      title: "Annual",
      price: "₹1,599",
      period: "/year",
      description: "Maximum savings",
      icon: Star,
      features: [
        "Everything in Quarterly",
        "Exclusive annual content",
        "Author meet & greets",
        "Physical book discounts",
      ],
    },
    {
      title: "Lifetime",
      price: "₹3,999",
      period: "one-time",
      description: "Never pay again",
      icon: Infinity,
      features: [
        "Lifetime access to library",
        "All future releases included",
        "VIP customer support",
        "Exclusive lifetime member perks",
      ],
    },
  ]

  const publishingPlans: Plan[] = [
    {
      title: "Poetry Publishing",
      price: "Starting ₹999",
      description: "For poets and poetry collections",
      icon: Star,
      features: ["Professional editing", "Cover design", "ISBN assignment", "Digital distribution"],
    },
    {
      title: "Story Publishing",
      price: "Starting ₹1,499",
      description: "For short stories and novellas",
      icon: Crown,
      features: ["Comprehensive editing", "Custom cover design", "Marketing support", "Print-on-demand option"],
    },
  ]

  const getCurrentPlans = () => {
    switch (activeTab) {
      case "ebooks":
        return ebookPlans
      case "subscription":
        return subscriptionPlans
      case "publishing":
        return publishingPlans
      default:
        return subscriptionPlans
    }
  }

  return (
    <section id="pricing" ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Flexible pricing options to suit every reader and author
          </p>
        </div>

        {/* Pricing Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-muted p-1 rounded-lg">
            {[
              { key: "ebooks", label: "E-books" },
              { key: "subscription", label: "Subscriptions" },
              { key: "publishing", label: "Publishing" },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.key as any)}
                className="mx-1"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div
          className={`grid gap-8 ${getCurrentPlans().length === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : getCurrentPlans().length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" : "grid-cols-1 max-w-md mx-auto"}`}
        >
          {getCurrentPlans().map((plan, index) => (
            <Card
              key={index}
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
                    <plan.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  {plan.price}
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full group" variant={plan.popular ? "default" : "outline"}>
                  {activeTab === "publishing" ? "Get Quote" : "Choose Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            * Prices are subject to revision. Current prices are rough estimates.
          </p>
          <p className="text-sm text-muted-foreground">
            All plans include customer support and regular updates. Contact us for custom enterprise solutions.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Pricing
// This code defines a Pricing section for a website, showcasing different plans for e-books, subscriptions, and publishing services.