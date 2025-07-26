"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, Award, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import anime from "animejs"

export function Hero() {
  const [_isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const tl = anime.timeline({
      easing: "easeOutQuart",
      complete: () => setIsLoaded(true),
    })

    tl.add({
      targets: ".hero-title",
      opacity: [0, 1],
      translateY: [50, 0],
      duration: 800,
    })
      .add(
        {
          targets: ".hero-subtitle",
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 600,
        },
        "-=400",
      )
      .add(
        {
          targets: ".hero-cta",
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 500,
        },
        "-=300",
      )
      .add(
        {
          targets: ".hero-stats",
          opacity: [0, 1],
          scale: [0.8, 1],
          duration: 600,
          delay: anime.stagger(100),
        },
        "-=200",
      )

    // Floating animation for decorative elements
    anime({
      targets: ".floating-element",
      translateY: [-10, 10],
      duration: 2000,
      direction: "alternate",
      loop: true,
      easing: "easeInOutSine",
      delay: anime.stagger(200),
    })
  }, [])

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-orange-50"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-element absolute top-20 left-10 w-20 h-20 bg-orange-200 rounded-full blur-xl" />
        <div className="floating-element absolute top-40 right-20 w-32 h-32 bg-amber-200 rounded-full blur-xl" />
        <div className="floating-element absolute bottom-20 left-1/4 w-24 h-24 bg-orange-300 rounded-full blur-xl" />
        <div className="floating-element absolute bottom-40 right-1/3 w-16 h-16 bg-amber-300 rounded-full blur-xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="hero-title mb-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent leading-tight">
              DNA Publications
            </h1>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Sparkles className="h-6 w-6 text-orange-600 animate-pulse" />
              <span className="text-xl md:text-2xl font-semibold text-muted-foreground">
                The Home of Ambitious Writers
              </span>
              <Sparkles className="h-6 w-6 text-orange-600 animate-pulse" />
            </div>
          </div>

          <p className="hero-subtitle text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover extraordinary stories, publish your masterpiece, and join a community of passionate readers and
            writers. Your literary journey begins here.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="group text-lg px-8 py-6 bg-orange-600 hover:bg-orange-700">
              <Link to="/books">
                Explore Books
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent border-orange-600 text-orange-600 hover:bg-orange-50">
              <Link to="/pricing">
                Publish With Us
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="hero-stats text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-8 w-8 text-orange-600 mr-2" />
                <span className="text-3xl font-bold text-foreground">500+</span>
              </div>
              <p className="text-muted-foreground">Published Books</p>
            </div>
            <div className="hero-stats text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-orange-600 mr-2" />
                <span className="text-3xl font-bold text-foreground">10K+</span>
              </div>
              <p className="text-muted-foreground">Happy Readers</p>
            </div>
            <div className="hero-stats text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-8 w-8 text-orange-600 mr-2" />
                <span className="text-3xl font-bold text-foreground">50+</span>
              </div>
              <p className="text-muted-foreground">Award Winners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-orange-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-orange-600 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}