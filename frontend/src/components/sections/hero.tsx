"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import anime from "animejs"
import { useHeroBanners } from "@/hooks/use-hero-banners"

export function Hero() {
  const [_isLoaded, setIsLoaded] = useState(false)
  const { heroBanners } = useHeroBanners()
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [showBanners, setShowBanners] = useState(false)

  // Filter active banners and sort by order
  const activeBanners = heroBanners
    .filter(banner => banner.isActive)
    .sort((a, b) => a.order - b.order)

  // Auto-advance banners
  useEffect(() => {
    if (activeBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)
      }, 5000) // Change banner every 5 seconds

      return () => clearInterval(interval)
    }
  }, [activeBanners.length])

  // Show banners if any are available
  useEffect(() => {
    setShowBanners(activeBanners.length > 0)
  }, [activeBanners.length])

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)
  }

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
  }

  const handleBannerClick = (banner: any) => {
    if (banner.redirectType === 'page') {
      window.location.href = banner.redirectValue
    } else {
      window.open(banner.redirectValue, '_blank')
    }
  }

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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-purple-50"
    >
      {/* Banner Display */}
      {showBanners && activeBanners.length > 0 ? (
        <div className="absolute inset-0 w-full h-full">
          {/* Banner Image */}
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${activeBanners[currentBannerIndex]?.imageUrl})`,
            }}
          />
          
          {/* Banner Overlay */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Banner Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                {activeBanners[currentBannerIndex]?.title}
              </h1>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
                onClick={() => handleBannerClick(activeBanners[currentBannerIndex])}
              >
                Learn More <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Banner Navigation */}
          {activeBanners.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Next Button */}
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Banner Indicators */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {activeBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="floating-element absolute top-20 left-10 w-20 h-20 bg-purple-200 rounded-full blur-xl" />
            <div className="floating-element absolute top-40 right-20 w-32 h-32 bg-yellow-200 rounded-full blur-xl" />
            <div className="floating-element absolute bottom-20 left-1/4 w-24 h-24 bg-purple-300 rounded-full blur-xl" />
            <div className="floating-element absolute bottom-40 right-1/3 w-16 h-16 bg-yellow-300 rounded-full blur-xl" />
          </div>

          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
          <div className="hero-title mb-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight">
              DNA Publications
            </h1>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-xl md:text-2xl font-semibold text-muted-foreground">
                The Home of Ambitious Writers
              </span>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>

          <p className="hero-subtitle text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover extraordinary stories, publish your masterpiece, and join a community of passionate readers and
            writers. Your literary journey begins here.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90">
              <Link to="/books">
                Explore Books
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent border-primary text-primary hover:bg-primary/10">
              <Link to="/services">
                Publish With Us
              </Link>
            </Button>
          </div>

          {/* Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
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
            </div> */}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
              <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
        </>
      )}
    </section>
  )
}