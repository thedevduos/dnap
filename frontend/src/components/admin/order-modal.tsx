"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { MapPin, CreditCard, Phone } from "lucide-react"
import { updateOrderStatus } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"

interface OrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: any
}

export function OrderModal({ open, onOpenChange, order }: OrderModalProps) {
  const { toast } = useToast()
  const [newStatus, setNewStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  if (!order) return null

  const handleStatusUpdate = async () => {
    if (!newStatus) return

    setIsUpdating(true)
    try {
      const updateData: any = { status: newStatus }
      
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber
      }
      
      if (notes) {
        updateData.adminNotes = notes
      }

      await updateOrderStatus(order.id, newStatus, updateData)
      
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "shipped": return "bg-purple-100 text-purple-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Order #{order.id.slice(-8)}</DialogTitle>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-20 flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">by {item.author}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer & Shipping Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </h3>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">
                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.shippingAddress?.address1}
                  </p>
                  {order.shippingAddress?.address2 && (
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.address2}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress?.country}
                  </p>
                  {order.shippingAddress?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center mt-2">
                      <Phone className="h-4 w-4 mr-2" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </h3>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">
                    {order.paymentMethod === 'payu' ? 'PayU Payment Gateway' :
                 order.paymentMethod === 'razorpay' ? 'Razorpay' :
                 order.paymentMethod === 'zoho' ? 'Zoho Pay' :
                 order.paymentMethod}
                  </p>
                  {order.transactionId && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Transaction ID: {order.transactionId}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Payment Status: {order.paymentStatus || 'Pending'}
                  </p>

                </div>
              </div>
            </div>

            {/* Order Summary & Actions */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₹{order.tax}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Update Order</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Order Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newStatus === "shipped" && (
                    <div>
                      <Label>Tracking Number</Label>
                      <Input
                        placeholder="Enter tracking number"
                        value={trackingNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Admin Notes</Label>
                    <Textarea
                      placeholder="Add notes about this order..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleStatusUpdate} 
                    disabled={!newStatus || isUpdating}
                    className="w-full"
                  >
                    {isUpdating ? "Updating..." : "Update Order"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}