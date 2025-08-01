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
import { Sparkles } from "lucide-react"

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {update ? "Edit Update" : "Add New Update"}
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            {update ? "Modify your promotional message" : "Create a new promotional banner for your website"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="type" className="text-sm font-medium">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="textEnglish" className="text-sm font-medium">
              Message Text (English) *
            </Label>
            <Textarea
              id="textEnglish"
              value={formData.textEnglish}
              onChange={(e) => setFormData({ ...formData, textEnglish: e.target.value })}
              placeholder="Enter your promotional message here..."
              className="h-32 resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              This message will appear in the promotional banner at the top of your website
            </p>
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium mb-4">Preview</h3>
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-lg">
              <div className="flex items-center justify-center space-x-3">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="font-medium">
                  {formData.textEnglish || "Your message will appear here..."}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                "Saving..."
              ) : update ? (
                "Update Changes"
              ) : (
                "Create Update"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}