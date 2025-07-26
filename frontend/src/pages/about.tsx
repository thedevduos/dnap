"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Award, Heart, Zap, Globe } from "lucide-react"
import anime from "animejs"

export default function AboutPage() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: ".about-card",
              opacity: [0, 1],
              translateY: [50, 0],
              scale: [0.9, 1],
              delay: anime.stagger(200),
              duration: 800,
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

  const features = [
    {
      icon: BookOpen,
      title: "Quality Publishing",
      description: "We maintain the highest standards in publishing, ensuring every book meets our quality criteria.",
    },
    {
      icon: Users,
      title: "Author Support",
      description: "Comprehensive support for authors throughout their publishing journey, from manuscript to market.",
    },
    {
      icon: Award,
      title: "Award-Winning",
      description: "Our publications have won numerous literary awards and recognition in the industry.",
    },
    {
      icon: Heart,
      title: "Passionate Team",
      description: "A dedicated team of literary enthusiasts committed to bringing great stories to readers.",
    },
    {
      icon: Zap,
      title: "Fast Publishing",
      description: "Streamlined publishing process that gets your work to readers quickly without compromising quality.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Distribution network that spans across multiple countries and digital platforms.",
    },
  ]

  return (
    <section ref={sectionRef} className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            About DNA Publications
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Founded with a passion for literature and storytelling, DNA Publications has been at the forefront of
            bringing exceptional stories to readers worldwide. We believe every story deserves to be told and every
            reader deserves quality content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="about-card group hover:shadow-lg transition-all duration-300 border-0 bg-muted/30"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors duration-300">
                    <feature.icon className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              To democratize publishing and make quality literature accessible to everyone. We strive to create a
              platform where emerging and established authors can share their stories with the world, while providing
              readers with diverse, engaging, and thought-provoking content.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}