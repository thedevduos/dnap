"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { useTestimonials } from "@/hooks/use-testimonials"

export function Testimonials() {
  const { testimonials, loading } = useTestimonials()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (testimonials.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [testimonials.length])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">What Our Readers Say</h2>
          </div>
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">What Our Readers Say</h2>
            <p className="text-muted-foreground">No testimonials available at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">What Our Readers Say</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hear from our community of readers who have experienced the magic of Tamil literature through our
            publications.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="relative">
            <CardContent className="p-8 md:p-12">
              <div className="text-center">
                <img
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  className="w-20 h-20 rounded-full mx-auto mb-6 object-cover"
                />

                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < currentTestimonial.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <blockquote className="text-lg md:text-xl text-muted-foreground mb-6 italic">
                  "{currentTestimonial.content}"
                </blockquote>

                <div>
                  <div className="font-semibold text-foreground">{currentTestimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{currentTestimonial.designation}</div>
                </div>
              </div>
            </CardContent>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-transparent"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Card>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
// The testimonials are displayed in a card format with the reader's name, designation, rating, and content.