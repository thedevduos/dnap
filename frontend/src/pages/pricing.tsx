"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown, Infinity } from "lucide-react"
import anime from "animejs"

export default function PricingPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeTab, setActiveTab] = useState<"multiple" | "single">("multiple")

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
    title: string;
    price: string;
    description: string;
    icon: typeof Star;
    features: string[];
    period?: string;
    popular?: boolean;
  };

  const multipleEbookPlans: Plan[] = [
    {
      title: "Basic",
      price: "₹129",
      period: "/month",
      description: "3 Books per month",
      icon: Star,
      features: ["3 Books per month", "Online reading only", "Multiple formats (PDF, EPUB)", "Customer support"],
    },
    {
      title: "Standard",
      price: "₹299",
      period: "/month",
      description: "10 Books per month",
      icon: Zap,
      popular: true,
      features: ["10 Books per month", "Online reading only", "Priority customer support", "New releases included"],
    },
    {
      title: "Premium",
      price: "₹499",
      period: "/month",
      description: "Unlimited Books per month",
      icon: Crown,
      features: ["Unlimited Books per month", "Online reading only", "VIP customer support", "Early access to new releases", "Exclusive content"],
    },
    {
      title: "Lifetime",
      price: "₹4,999",
      period: "one-time",
      description: "Unlimited for 5 years",
      icon: Infinity,
      features: ["Unlimited access for 5 years", "Online reading only", "All future releases included", "VIP customer support", "Exclusive lifetime member perks"],
    },
  ];

  const singleEbookPlans: Plan[] = [
    {
      title: "Basic",
      price: "₹49",
      period: "/month",
      description: "Limited Collection Only",
      icon: Star,
      features: ["Limited collection access", "Online reading only", "Multiple formats (PDF, EPUB)", "Customer support"],
    },
    {
      title: "Standard",
      price: "₹99",
      period: "/month",
      description: "Additional Limited Books Only",
      icon: Zap,
      popular: true,
      features: ["Additional limited books", "Online reading only", "Priority customer support", "New releases included"],
    },
    {
      title: "Premium",
      price: "₹149",
      period: "/month",
      description: "Any 1 Book - 1 Month Online Copy",
      icon: Crown,
      features: ["Any 1 book for 1 month", "Online reading only", "VIP customer support", "Flexible book selection"],
    },
    {
      title: "Lifetime",
      price: "₹999",
      period: "one-time",
      description: "For 5 years",
      icon: Infinity,
      features: ["Access for 5 years", "Online reading only", "All books included", "VIP customer support", "Exclusive lifetime member perks"],
    },
  ];

  const getCurrentPlans = () => {
    switch (activeTab) {
      case "multiple":
        return multipleEbookPlans
      case "single":
        return singleEbookPlans
      default:
        return multipleEbookPlans
    }
  }

  return (
    <section ref={sectionRef} className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Flexible pricing options to suit every reader
          </p>
        </div>

        {/* Pricing Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-muted p-1 rounded-lg">
            {[
              { key: "multiple", label: "Multiple E Books" },
              { key: "single", label: "Single E Book" },
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

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {getCurrentPlans().map((plan, index) => (
            <Card
              key={index}
              className={`pricing-card relative group hover:shadow-xl transition-all duration-300 ${
                plan.popular ? "ring-2 ring-orange-500 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500">Most Popular</Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors duration-300">
                    <plan.icon className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                <div className="text-3xl font-bold text-orange-600">
                  {plan.price}
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-orange-600 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full group" variant={plan.popular ? "default" : "outline"}>
                  Choose Plan
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