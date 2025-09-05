// Device detection utilities
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check for mobile user agent
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone',
    'mobile', 'tablet', 'phone'
  ]
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
  
  // Check for touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // Check screen size (mobile typically has smaller screens)
  const isSmallScreen = window.innerWidth <= 768
  
  // Check for mobile-specific features
  const hasMobileFeatures = 'orientation' in window || 'deviceorientation' in window
  
  return isMobileUA || (hasTouchScreen && isSmallScreen) || hasMobileFeatures
}

export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const tabletKeywords = ['ipad', 'tablet']
  
  return tabletKeywords.some(keyword => userAgent.includes(keyword)) || 
         (window.innerWidth > 768 && window.innerWidth <= 1024 && 'ontouchstart' in window)
}

export const isDesktopDevice = (): boolean => {
  return !isMobileDevice() && !isTabletDevice()
}

// Screen recording and screenshot protection
export const enableScreenProtection = (): void => {
  if (typeof window === 'undefined') return
  
  // Prevent screenshots and screen recording
  const preventScreenshot = () => {
    // Disable print screen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.key === 's')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }, true)
    
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }, true)
    
    // Disable text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }, true)
    
    // Disable drag and drop
    document.addEventListener('dragstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }, true)

    // Disable copy operations
    document.addEventListener('copy', (e) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }, true)

    // Disable cut operations
    document.addEventListener('cut', (e) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }, true)

    // Disable paste operations
    document.addEventListener('paste', (e) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }, true)

    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Prevent Ctrl+A (select all)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Prevent Ctrl+C (copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Prevent Ctrl+X (cut)
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Prevent Ctrl+V (paste)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Prevent F12 (developer tools)
      if (e.key === 'F12') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Prevent Ctrl+Shift+I (developer tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Prevent Ctrl+Shift+C (developer tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Prevent Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }, true)
  }
  
  // CSS to prevent screen recording (creates black overlay during recording)
  const addScreenRecordingProtection = () => {
    const style = document.createElement('style')
    style.textContent = `
      /* Prevent screenshots with CSS */
      .screenshot-protection {
        -webkit-filter: blur(0px);
        filter: blur(0px);
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Blur content when screenshot is detected */
      body.screenshot-detected .screenshot-protection {
        -webkit-filter: blur(10px);
        filter: blur(10px);
      }
      
      @media screen and (display-mode: fullscreen) {
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          z-index: 999999;
          pointer-events: none;
        }
      }
      
      /* Prevent screen recording on mobile */
      @media (max-width: 768px) {
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          z-index: 999999;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        body.recording::before {
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)
  }
  
  // Detect screen recording attempts
  const detectScreenRecording = () => {
    // Method 1: Check for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        document.body.classList.add('recording')
      } else {
        document.body.classList.remove('recording')
      }
    })
    
    // Method 2: Check for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.body.classList.add('recording')
      } else {
        document.body.classList.remove('recording')
      }
    })
    
    // Method 3: Monitor for screen recording APIs
    if ('getDisplayMedia' in navigator) {
      navigator.mediaDevices.getDisplayMedia = function() {
        document.body.classList.add('recording')
        
        // Return a rejected promise to prevent screen sharing
        return Promise.reject(new Error('Screen recording is not allowed'))
      }
    }
    
    // Method 4: Detect mobile screen recording (iOS/Android)
    if ('webkitRequestFullscreen' in document.documentElement) {
      // iOS Safari detection
      document.addEventListener('webkitfullscreenchange', () => {
        if ((document as any).webkitFullscreenElement) {
          document.body.classList.add('recording')
        } else {
          document.body.classList.remove('recording')
        }
      })
    }
    
    // Method 5: Monitor for media stream attempts
    if ('mediaDevices' in navigator) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia
      navigator.mediaDevices.getUserMedia = function(...args) {
        // Check if trying to access screen or video
        const constraints = args[0] as any
        if (constraints && (constraints.video || constraints.screen)) {
          document.body.classList.add('recording')
          return Promise.reject(new Error('Screen recording is not allowed'))
        }
        return originalGetUserMedia.apply(this, args)
      }
    }
    
    // Method 6: Detect when app goes to background (common during screen recording)
    document.addEventListener('blur', () => {
      document.body.classList.add('recording')
    })
    
    document.addEventListener('focus', () => {
      document.body.classList.remove('recording')
    })

    // Method 7: Detect screenshot attempts using visibility API
    let hidden = 'hidden'
    let visibilityChange = 'visibilitychange'
    
    if (typeof document.hidden !== 'undefined') {
      hidden = 'hidden'
      visibilityChange = 'visibilitychange'
    } else if (typeof (document as any).msHidden !== 'undefined') {
      hidden = 'msHidden'
      visibilityChange = 'msvisibilitychange'
    } else if (typeof (document as any).webkitHidden !== 'undefined') {
      hidden = 'webkitHidden'
      visibilityChange = 'webkitvisibilitychange'
    }
    
    document.addEventListener(visibilityChange, () => {
      if ((document as any)[hidden]) {
        document.body.classList.add('screenshot-detected')
        setTimeout(() => {
          document.body.classList.remove('screenshot-detected')
        }, 2000)
      }
    })

    // Method 8: Detect window resize (common during screenshots)
    let resizeTimeout: NodeJS.Timeout
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout)
      document.body.classList.add('screenshot-detected')
      resizeTimeout = setTimeout(() => {
        document.body.classList.remove('screenshot-detected')
      }, 1000)
    })
  }
  
  preventScreenshot()
  addScreenRecordingProtection()
  detectScreenRecording()
}

// Disable screen protection
export const disableScreenProtection = (): void => {
  if (typeof window === 'undefined') return
  
  document.body.classList.remove('recording', 'screenshot-detected')
  
  // Remove event listeners (this is a simplified version)
  // In a real implementation, you'd need to store references to the event listeners
}

// Check if device supports the required features
export const checkDeviceCompatibility = (): {
  isCompatible: boolean
  reason?: string
} => {
  if (isDesktopDevice()) {
    return {
      isCompatible: false,
      reason: 'Reader is only available on mobile devices'
    }
  }
  
  if (!isMobileDevice() && !isTabletDevice()) {
    return {
      isCompatible: false,
      reason: 'Device not recognized as mobile or tablet'
    }
  }
  
  return { isCompatible: true }
} 