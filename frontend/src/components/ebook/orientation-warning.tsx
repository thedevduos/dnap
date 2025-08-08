"use client"

import { useState, useEffect } from "react"
import { Smartphone, RotateCcw } from "lucide-react"

export function OrientationWarning() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      // Check if device is mobile and in landscape mode
      const isMobile = window.innerWidth <= 768
      const isLandscape = window.innerWidth > window.innerHeight
      
      setShowWarning(isMobile && isLandscape)
    }

    checkOrientation()
    
    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="orientation-warning">
      <div className="text-center">
        <Smartphone className="h-12 w-12 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold mb-2">Rotate Your Device</h3>
        <p className="text-lg mb-4">
          For the best reading experience, please rotate your device to portrait mode
        </p>
        <div className="flex items-center justify-center">
          <RotateCcw className="h-6 w-6 mr-2 animate-spin" />
          <span className="text-sm">Rotate to portrait</span>
        </div>
      </div>
    </div>
  )
} 