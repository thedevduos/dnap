"use client"

import React, { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Languages, Palette, Globe, Printer, Shield, Smartphone, School, User } from "lucide-react"
import anime from "animejs"

export function Services() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: ".service-card",
              opacity: [0, 1],
              translateY: [30, 0],
              scale: [0.95, 1],
              delay: anime.stagger(100),
              duration: 600,
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


  type Service = {
    id: string
    title: string
    description: string
    icon: typeof BookOpen
  }

  const services: Service[] = [
    {
      id: "book-publishing",
      title: "Book Publishing",
      description: "Complete end-to-end book publishing services from manuscript to market",
      icon: BookOpen
    },
    {
      id: "author-mentorship",
      title: "Author Mentorship & Guidance",
      description: "Professional guidance and mentorship for aspiring and established authors",
      icon: User
    },
    {
      id: "translation-transcription",
      title: "Translation & Transcription",
      description: "Professional translation services and audio transcription for your content",
      icon: Languages
    },
    {
      id: "design-works",
      title: "Book overall internal & external Design works",
      description: "Comprehensive design services for book covers, layouts, and visual elements",
      icon: Palette
    },
    {
      id: "print-formatting",
      title: "Print-Ready Formatting & Printing",
      description: "Professional formatting and high-quality printing services for your book",
      icon: Printer
    },
    {
      id: "copyright-registration",
      title: "Copyrights Registration",
      description: "Complete copyright registration and intellectual property protection",
      icon: Shield
    },
    {
      id: "ebook-conversion",
      title: "eBook Conversion (PDF, ePub, Mobile)",
      description: "Digital conversion services for various eBook formats and platforms",
      icon: Smartphone
    },
    {
      id: "global-distribution",
      title: "Global & E-commerce Distribution (Amazon, Flipkart, etc.)",
      description: "Worldwide distribution across major online and offline platforms",
      icon: Globe
    },
    {
      id: "outreach-programs",
      title: "Outreach Programs (Schools, Colleges, Cultural Bodies)",
      description: "Educational and cultural outreach programs to promote your book",
      icon: School
    },
  ]

  return (
    <section id="services" ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Our Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From manuscript to market, we provide end-to-end publishing solutions and comprehensive author support services
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className="service-card group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 flex-shrink-0">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-primary transition-colors duration-300">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services