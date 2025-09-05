"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, BookOpen, PenTool, GraduationCap, Heart } from "lucide-react"
import anime from "animejs"

type BookPublishingPackage = {
  id: string
  title: string
  price: string
  description: string
  icon: typeof BookOpen
  features: string[]
  popular?: boolean
}

const bookPublishingPackages: BookPublishingPackage[] = [
  {
    id: "poem-quote",
    title: "Poem/Quote Book",
    price: "₹1,499 + GST",
    description: "Perfect for poetry collections and inspirational quotes",
    icon: PenTool,
    features: [
      "Professional formatting",
      "ISBN registration",
      "Print-ready files",
      "Basic cover design",
      "Distribution setup"
    ]
  },
  {
    id: "novel-story",
    title: "Novel / Story Book",
    price: "₹1,999 + GST",
    description: "Complete novel and story book publishing package",
    icon: BookOpen,
    features: [
      "Professional formatting",
      "ISBN registration",
      "Print-ready files",
      "Enhanced cover design",
      "Distribution setup",
      "Marketing support"
    ],
    popular: true
  },
  {
    id: "academic-research",
    title: "Academic / Research Book",
    price: "₹2,999 + GST",
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
    ]
  },
  {
    id: "self-help-spiritual",
    title: "Self-Help / Spiritual Book",
    price: "₹3,999 + GST",
    description: "Comprehensive package for self-help and spiritual books",
    icon: Heart,
    features: [
      "Professional formatting",
      "ISBN registration",
      "Print-ready files",
      "Premium cover design",
      "Distribution setup",
      "Marketing support",
      "Author consultation"
    ]
  }
]

export default function PricingPage() {
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

  return (
    <section ref={sectionRef} className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Book Publishing Rates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional book publishing services tailored to your needs
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {bookPublishingPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`pricing-card relative group hover:shadow-xl transition-all duration-300 ${
                pkg.popular ? "ring-2 ring-orange-500 scale-105" : ""
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500">Most Popular</Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors duration-300">
                    <pkg.icon className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-lg font-bold">{pkg.title}</CardTitle>
                <div className="text-2xl font-bold text-orange-600">
                  {pkg.price}
                </div>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-orange-600 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

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