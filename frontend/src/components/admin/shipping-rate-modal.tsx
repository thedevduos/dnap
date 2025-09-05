"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addShippingRate, updateShippingRate } from "@/lib/firebase-utils"
import { validateShippingRate } from "@/lib/shipping-rates-utils"

interface ShippingRateModalProps {
  isOpen: boolean
  onClose: () => void
  rate?: any | null
}

export function ShippingRateModal({ isOpen, onClose, rate }: ShippingRateModalProps) {
  const [formData, setFormData] = useState({
    minWeight: "",
    maxWeight: "",
    tamilnadu: "",
    india: "",
    international: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (rate) {
      setFormData({
        minWeight: rate.minWeight?.toString() || "",
        maxWeight: rate.maxWeight?.toString() || "",
        tamilnadu: rate.tamilnadu?.toString() || "",
        india: rate.india?.toString() || "",
        international: rate.international?.toString() || "",
      })
    } else {
      setFormData({
        minWeight: "",
        maxWeight: "",
        tamilnadu: "",
        india: "",
        international: "",
      })
    }
  }, [rate, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const rateData = {
        minWeight: parseFloat(formData.minWeight) || 0,
        maxWeight: parseFloat(formData.maxWeight) || 0,
        tamilnadu: parseFloat(formData.tamilnadu) || 0,
        india: parseFloat(formData.india) || 0,
        international: parseFloat(formData.international) || 0,
      }

      // Validate the data
      const errors = validateShippingRate(rateData)
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(", "),
          variant: "destructive",
        })
        return
      }

      if (rate) {
        await updateShippingRate(rate.id, rateData)
        toast({
          title: "Success",
          description: "Shipping rate updated successfully!",
        })
      } else {
        await addShippingRate(rateData)
        toast({
          title: "Success",
          description: "Shipping rate added successfully!",
        })
      }

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save shipping rate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {rate ? "Edit Shipping Rate" : "Add New Shipping Rate"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minWeight">Minimum Weight (KG) *</Label>
              <Input
                id="minWeight"
                type="number"
                step="0.1"
                min="0"
                value={formData.minWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, minWeight: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxWeight">Maximum Weight (KG) *</Label>
              <Input
                id="maxWeight"
                type="number"
                step="0.1"
                min="0"
                value={formData.maxWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, maxWeight: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Shipping Rates (₹)</h4>
            
            <div>
              <Label htmlFor="tamilnadu">Tamil Nadu *</Label>
              <Input
                id="tamilnadu"
                type="number"
                min="0"
                value={formData.tamilnadu}
                onChange={(e) => setFormData(prev => ({ ...prev, tamilnadu: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="india">Other Indian States *</Label>
              <Input
                id="india"
                type="number"
                min="0"
                value={formData.india}
                onChange={(e) => setFormData(prev => ({ ...prev, india: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="international">International *</Label>
              <Input
                id="international"
                type="number"
                min="0"
                value={formData.international}
                onChange={(e) => setFormData(prev => ({ ...prev, international: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : rate ? "Update Rate" : "Add Rate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
