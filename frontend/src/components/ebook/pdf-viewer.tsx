"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCw, Smartphone, AlertTriangle, FileText, RefreshCw, ExternalLink, Download } from "lucide-react"
import { OrientationWarning } from "./orientation-warning"
import { enableScreenProtection, disableScreenProtection, checkDeviceCompatibility } from "@/lib/device-utils"

interface PDFViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfUrl: string
  bookTitle: string
}

export function PDFViewer({ open, onOpenChange, pdfUrl, bookTitle }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [deviceCompatible, setDeviceCompatible] = useState<boolean | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (open) {
      setLoading(true)
      setError(null)
      setZoom(100)
      setRotation(0)
      
      // Check device compatibility
      const compatibility = checkDeviceCompatibility()
      setDeviceCompatible(compatibility.isCompatible)
      
      // Enable screen protection if device is compatible
      if (compatibility.isCompatible) {
        enableScreenProtection()
      }

      // Validate PDF URL
      if (!pdfUrl) {
        setError("PDF URL is not available")
        setLoading(false)
        return
      }

      // Ensure PDF URL is properly formatted for mobile compatibility
      if (!pdfUrl.includes('#')) {
        // Add PDF viewer parameters for better mobile compatibility
        // The iframe src will handle this formatting
      }

      // Set a timeout to detect if PDF fails to load
      loadTimeoutRef.current = setTimeout(() => {
        if (loading) {
          setError("PDF is taking too long to load. Please check your connection.")
          setLoading(false)
        }
      }, 20000) // 20 seconds timeout
    } else {
      // Disable screen protection when closing
      disableScreenProtection()
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [open, pdfUrl])

  // Cleanup screen protection on unmount
  useEffect(() => {
    return () => {
      disableScreenProtection()
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [])

  const handleLoad = () => {
    setLoading(false)
    setError(null)
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
  }

  const handleError = () => {
    setLoading(false)
    setError("Failed to load PDF. Please check your internet connection and try again.")
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
    
    // Reset timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
    loadTimeoutRef.current = setTimeout(() => {
      if (loading) {
        setError("PDF is taking too long to load. Please check your connection.")
        setLoading(false)
      }
    }, 20000)
  }

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank')
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${bookTitle}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(100)
    setRotation(0)
  }

  // Show device compatibility check
  if (deviceCompatible === false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Smartphone className="h-12 w-12 text-muted-foreground" />
                <AlertTriangle className="h-6 w-6 text-red-500 absolute -top-1 -right-1" />
              </div>
            </div>
            <DialogTitle className="text-center">Mobile Only Access</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              The ebook reader is only available on mobile devices and tablets for security reasons.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <OrientationWarning />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 [&>button]:hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {bookTitle}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground mr-2">
                  {zoom}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                  Reset
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="relative h-[80vh] bg-gray-100 overflow-hidden pdf-viewer-container screen-recording-protection no-select no-context-menu no-drag no-copy">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading PDF...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
                <div className="text-center p-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                  <div className="space-y-2">
                    <Button onClick={handleRetry} size="sm" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                    <Button onClick={handleOpenInNewTab} variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button onClick={handleDownload} variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div 
              className="w-full h-full flex items-center justify-center screenshot-protection"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              <iframe
                ref={iframeRef}
                src={pdfUrl.includes('#') ? pdfUrl : `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&embedded=true`}
                className="border-0 w-full h-full"
                style={{
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1,
                  border: 'none',
                  outline: 'none'
                }}
                onLoad={handleLoad}
                onError={handleError}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                allow="fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                title={`PDF Viewer - ${bookTitle}`}
              />
            </div>
            
            {/* Overlay to prevent right-click and selection */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ 
                background: 'transparent',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                zIndex: 2
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
          
          <div className="p-4 border-t bg-red-50">
            <p className="text-xs text-red-600 text-center">
              ⚠️ This content is protected. Screenshots and screen recording are disabled. Downloading, copying, or sharing is prohibited.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}