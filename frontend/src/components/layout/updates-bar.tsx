"use client"

import { useState, useEffect } from "react"
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUpdates } from "@/hooks/use-updates"
import anime from "animejs"

export function UpdatesBar() {
  const [currentUpdate, setCurrentUpdate] = useState(0)
  const { updates } = useUpdates()

  useEffect(() => {
    if (updates.length > 0) {
      anime({
        targets: ".updates-bar",
        translateY: [-50, 0],
        opacity: [0, 1],
        duration: 600,
        easing: "easeOutQuart",
      })

      // Auto-rotate updates
      const rotateInterval = setInterval(() => {
        setCurrentUpdate((prev) => (prev + 1) % updates.length)
      }, 5000) // Increased to 5 seconds for better readability

      return () => clearInterval(rotateInterval)
    }
  }, [updates.length])

  useEffect(() => {
    if (updates.length > 0) {
      anime({
        targets: ".update-text",
        opacity: [0, 1],
        translateX: [20, 0],
        duration: 400,
        easing: "easeOutQuart",
      })
    }
  }, [currentUpdate, updates])

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentUpdate((prev) => (prev - 1 + updates.length) % updates.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentUpdate((prev) => (prev + 1) % updates.length)
  }

  if (updates.length === 0) return null

  return (
    <div className="updates-bar bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-4 relative overflow-hidden shadow-lg">
      <div className="container mx-auto flex items-center justify-center relative">
        {/* Navigation Arrows */}
        {updates.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="absolute left-0 text-white/70 hover:text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full z-10"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="absolute right-0 text-white/70 hover:text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full z-10"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Main Content */}
        <div className="flex items-center justify-center space-x-3 max-w-4xl mx-auto">
          <Sparkles className="h-5 w-5 animate-pulse flex-shrink-0" />
          <span className="update-text text-lg font-semibold text-center leading-relaxed">
            {updates[currentUpdate]?.textEnglish || "Welcome to DNA Publications!"}
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      {updates.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {updates.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentUpdate(index)}
                className={`h-1 w-8 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentUpdate ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                }`}
                type="button"
              />
            ))}
          </div>
        </div>
      )}

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse" />
      </div>
    </div>
  )
}
