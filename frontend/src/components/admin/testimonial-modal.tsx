"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addTestimonial, updateTestimonial, uploadImage } from "@/lib/firebase-utils"
import { Upload } from "lucide-react"

interface TestimonialModalProps {
  isOpen: boolean
  onClose: () => void
  testimonial?: any | null
  onSuccess: () => void
}

export function TestimonialModal({ isOpen, onClose, testimonial, onSuccess }: TestimonialModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    content: "",
    rating: 5,
    status: "approved",
    image: "",
  })
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (testimonial) {
      setFormData({
        name: testimonial.name || "",
        designation: testimonial.designation || "",
        content: testimonial.content || "",
        rating: testimonial.rating || 5,
        status: testimonial.status || "approved",
        image: testimonial.image || "",
      })
    } else {
      setFormData({
        name: "",
        designation: "",
        content: "",
        rating: 5,
        status: "approved",
        image: "",
      })
    }
    setImageFile(null)
  }, [testimonial, isOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setIsUploading(true)

    try {
      const imageUrl = await uploadImage(file, "testimonials")
      setFormData({ ...formData, image: imageUrl })
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const testimonialData = {
        name: formData.name,
        designation: formData.designation,
        content: formData.content,
        rating: Number(formData.rating),
        status: formData.status,
        image: formData.image,
      }

      if (testimonial) {
        await updateTestimonial(testimonial.id, testimonialData)
        toast({
          title: "Success",
          description: "Testimonial updated successfully!",
        })
      } else {
        await addTestimonial(testimonialData)
        toast({
          title: "Success",
          description: "Testimonial added successfully!",
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save testimonial. Please try again.",
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
          <DialogTitle>{testimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Job title or role"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="content">Testimonial Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write the testimonial content..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rating">Rating *</Label>
              <Select
                value={formData.rating.toString()}
                onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="image">Profile Image</Label>
            <div className="mt-2">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image")?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Saving..." : testimonial ? "Update" : "Add Testimonial"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}