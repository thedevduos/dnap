"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Package, Truck, CheckCircle, Clock } from "lucide-react"
import { getOrderTracking } from "@/lib/shiprocket-utils"

interface OrderTrackingProps {
  orderId: string
  shiprocketOrderId?: string
  shiprocketAWB?: string
  courierName?: string
  trackingUrl?: string
  status?: string
}

export function OrderTracking({ 
  orderId, 
  shiprocketOrderId, 
  shiprocketAWB, 
  courierName, 
  trackingUrl,
  status 
}: OrderTrackingProps) {
  const [trackingData, setTrackingData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrackingData = async () => {
    if (!shiprocketOrderId) return

    setLoading(true)
    setError(null)
    
    try {
      const result = await getOrderTracking(shiprocketOrderId)
      if (result.success) {
        setTrackingData(result.trackingData)
      } else {
        setError(result.error || 'Failed to fetch tracking data')
      }
    } catch (err) {
      setError('Failed to fetch tracking data')
      console.error('Tracking error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (shiprocketOrderId) {
      fetchTrackingData()
    }
  }, [shiprocketOrderId])

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'shipped':
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'confirmed':
      case 'processing':
        return <Package className="h-5 w-5 text-orange-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
      case 'processing':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!shiprocketOrderId && !shiprocketAWB) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Order Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tracking information will be available once the order is processed.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Order Tracking
          </div>
          {trackingUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(trackingUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Track on Courier Site
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="font-medium">{orderId}</p>
          </div>
          {shiprocketAWB && (
            <div>
              <p className="text-sm text-gray-600">AWB Number</p>
              <p className="font-medium">{shiprocketAWB}</p>
            </div>
          )}
          {courierName && (
            <div>
              <p className="text-sm text-gray-600">Courier</p>
              <p className="font-medium">{courierName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <Badge className={getStatusColor(status || 'processing')}>
              {getStatusIcon(status || 'processing')}
              <span className="ml-1 capitalize">{status || 'Processing'}</span>
            </Badge>
          </div>
        </div>

        {/* Tracking Updates */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading tracking updates...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-600 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTrackingData}>
              Retry
            </Button>
          </div>
        ) : trackingData ? (
          <div className="space-y-3">
            <h4 className="font-medium">Tracking Updates</h4>
            <div className="space-y-2">
              {trackingData.tracking_data?.shipment_track?.map((update: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(update.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{update.status}</p>
                    <p className="text-xs text-gray-600">{update.location}</p>
                    <p className="text-xs text-gray-500">{update.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">No tracking updates available yet.</p>
            <Button variant="outline" size="sm" onClick={fetchTrackingData} className="mt-2">
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OrderTracking
