"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addShippingMethod, updateShippingMethod } from "@/lib/firebase-utils"

interface ShippingMethodModalProps {
  isOpen: boolean
  onClose: () => void
  method?: any | null
}

export function ShippingMethodModal({ isOpen, onClose, method }: ShippingMethodModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    deliveryTime: "",
    status: "active",
    minOrderValue: "",
    maxOrderValue: "",
    zones: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name || "",
        description: method.description || "",
        price: method.price?.toString() || "",
        deliveryTime: method.deliveryTime || "",
        status: method.status || "active",
        minOrderValue: method.minOrderValue?.toString() || "",
        maxOrderValue: method.maxOrderValue?.toString() || "",
        zones: method.zones || [],
      })
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        deliveryTime: "",
        status: "active",
        minOrderValue: "",
        maxOrderValue: "",
        zones: [],
      })
    }
  }, [method, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const methodData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        deliveryTime: formData.deliveryTime,
        status: formData.status,
        minOrderValue: parseFloat(formData.minOrderValue) || 0,
        maxOrderValue: parseFloat(formData.maxOrderValue) || 0,
        zones: formData.zones,
      }

      if (method) {
        await updateShippingMethod(method.id, methodData)
        toast({
          title: "Success",
          description: "Shipping method updated successfully!",
        })
      } else {
        await addShippingMethod(methodData)
        toast({
          title: "Success",
          description: "Shipping method added successfully!",
        })
      }

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save shipping method. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{method ? "Edit Shipping Method" : "Add New Shipping Method"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Method Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Standard Shipping"
                required
              />
            </div>
            <div>
              <Label htmlFor="deliveryTime">Delivery Time *</Label>
              <Input
                id="deliveryTime"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                placeholder="5-7 business days"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description of the shipping method..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <Label htmlFor="minOrderValue">Min Order Value (₹)</Label>
              <Input
                id="minOrderValue"
                type="number"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="maxOrderValue">Max Order Value (₹)</Label>
              <Input
                id="maxOrderValue"
                type="number"
                value={formData.maxOrderValue}
                onChange={(e) => setFormData({ ...formData, maxOrderValue: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : method ? "Update Method" : "Add Method"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}