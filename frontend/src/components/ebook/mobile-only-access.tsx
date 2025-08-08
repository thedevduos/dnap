"use client"

import { useEffect, useState } from "react"
import { Smartphone, Monitor, AlertTriangle } from "lucide-react"
import { isMobileDevice, isTabletDevice, checkDeviceCompatibility } from "@/lib/device-utils"

interface MobileOnlyAccessProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function MobileOnlyAccess({ children, fallback }: MobileOnlyAccessProps) {
  const [isCompatible, setIsCompatible] = useState<boolean | null>(null)
  const [deviceType, setDeviceType] = useState<string>('')

  useEffect(() => {
    const checkCompatibility = () => {
      const compatibility = checkDeviceCompatibility()
      setIsCompatible(compatibility.isCompatible)
      
      if (isMobileDevice()) {
        setDeviceType('mobile')
      } else if (isTabletDevice()) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    checkCompatibility()
    
    // Re-check on window resize
    const handleResize = () => {
      checkCompatibility()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Show loading state while checking device compatibility
  if (isCompatible === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If device is not compatible, show fallback or default message
  if (!isCompatible) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Monitor className="h-16 w-16 text-muted-foreground" />
                <AlertTriangle className="h-8 w-8 text-red-500 absolute -top-2 -right-2" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Mobile Only Access</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The ebook reader is only available on mobile devices and tablets for security reasons. 
              Please access this feature from your smartphone or tablet.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-primary mr-3" />
                <span className="font-semibold">Why Mobile Only?</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Enhanced security and content protection</li>
                <li>• Better reading experience on touch devices</li>
                <li>• Prevents unauthorized screenshots and recordings</li>
                <li>• Optimized for mobile viewing</li>
              </ul>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>Current device detected: <span className="font-medium">{deviceType}</span></p>
              <p className="mt-2">Please switch to a mobile device to continue</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If device is compatible, render children
  return <>{children}</>
} 