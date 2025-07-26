"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addUpdate, updateUpdate } from "@/lib/firebase-utils"

interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
  update?: any | null
  onSuccess: () => void
}

export function UpdateModal({ isOpen, onClose, update, onSuccess }: UpdateModalProps) {
  const [formData, setFormData] = useState({
    type: "announcement",
    textEnglish: "",
    status: "active",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (update) {
      setFormData({
        type: update.type || "announcement",
        textEnglish: update.textEnglish || "",
        status: update.status || "active",
      })
    } else {
      setFormData({
        type: "announcement",
        textEnglish: "",
        status: "active",
      })
    }
  }, [update, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updateData = {
        type: formData.type,
        textEnglish: formData.textEnglish,
        status: formData.status,
      }

      if (update) {
        await updateUpdate(update.id, updateData)
        toast({
          title: "Success",
          description: "Update modified successfully!",
        })
      } else {
        await addUpdate(updateData)
        toast({
          title: "Success",
          description: "Update added successfully!",
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save update. Please try again.",
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
          <DialogTitle>{update ? "Edit Update" : "Add New Update"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="textEnglish">Text (English) *</Label>
            <Textarea
              id="textEnglish"
              value={formData.textEnglish}
              onChange={(e) => setFormData({ ...formData, textEnglish: e.target.value })}
              placeholder="Update text in English..."
              rows={3}
              required
            />
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
              {isSubmitting ? "Saving..." : update ? "Update" : "Add Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}