"use client"

import { useState, useEffect } from "react"
import { X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUpdates } from "@/hooks/use-updates"
import anime from "animejs"

export function UpdatesBar() {
  const [isVisible, setIsVisible] = useState(true)
  const [currentUpdate, setCurrentUpdate] = useState(0)
  const { updates } = useUpdates()

  useEffect(() => {
    if (isVisible && updates.length > 0) {
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
      }, 3000)

      return () => clearInterval(rotateInterval)
    }
  }, [isVisible, updates.length])

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

  if (!isVisible || updates.length === 0) return null

  return (
    <div className="updates-bar bg-gradient-to-r from-primary to-orange-500 text-primary-foreground py-2 px-4 relative overflow-hidden">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="update-text text-sm font-medium">
            {updates[currentUpdate]?.textEnglish || "Welcome to DNA Publications!"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-primary-foreground hover:bg-white/20 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse" />
      </div>
    </div>
  )
}
