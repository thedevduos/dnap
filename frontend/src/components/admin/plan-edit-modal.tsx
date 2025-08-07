"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { updateEbookPlan } from "@/lib/ebook-utils"
import { EbookPlan } from "@/types/ebook"

interface PlanEditModalProps {
  isOpen: boolean
  onClose: () => void
  plan: EbookPlan | null
}

export function PlanEditModal({ isOpen, onClose, plan }: PlanEditModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    period: "",
    description: "",
    type: "multiple" as "single" | "multiple",
    maxBooks: "",
    duration: "",
    popular: false,
    features: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newFeature, setNewFeature] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || "",
        price: plan.price?.toString() || "",
        period: plan.period || "",
        description: plan.description || "",
        type: plan.type || "multiple",
        maxBooks: plan.maxBooks?.toString() || "",
        duration: plan.duration?.toString() || "",
        popular: plan.popular || false,
        features: plan.features || []
      })
    }
  }, [plan, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan) return

    setIsSubmitting(true)

    try {
      const planData = {
        title: formData.title,
        price: parseFloat(formData.price),
        period: formData.period,
        description: formData.description,
        type: formData.type,
        duration: parseInt(formData.duration),
        popular: formData.popular,
        features: formData.features,
        ...(formData.type === "single" && formData.maxBooks && {
          maxBooks: parseInt(formData.maxBooks)
        })
      }

      await updateEbookPlan(plan.id, planData)
      toast({
        title: "Success",
        description: "Plan updated successfully!",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      })
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit E-book Plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Plan title"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="299"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Period *</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData({ ...formData, period: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/month">/month</SelectItem>
                  <SelectItem value="/year">/year</SelectItem>
                  <SelectItem value="one-time">one-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "single" | "multiple") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple">Multiple E-books</SelectItem>
                  <SelectItem value="single">Single E-book</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Plan description..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (days) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                required
              />
            </div>
            {formData.type === "single" && (
              <div>
                <Label htmlFor="maxBooks">Max Books</Label>
                <Input
                  id="maxBooks"
                  type="number"
                  value={formData.maxBooks}
                  onChange={(e) => setFormData({ ...formData, maxBooks: e.target.value })}
                  placeholder="1"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="popular"
              checked={formData.popular}
              onCheckedChange={(checked) => setFormData({ ...formData, popular: checked as boolean })}
            />
            <Label htmlFor="popular">Mark as Popular</Label>
          </div>

          <div>
            <Label>Features</Label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.features]
                      newFeatures[index] = e.target.value
                      setFormData({ ...formData, features: newFeatures })
                    }}
                    placeholder="Feature description"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add new feature"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 