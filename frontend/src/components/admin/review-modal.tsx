"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Star, BookOpen, User, Calendar } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  review?: any
  onUpdate?: (reviewId: string, updates: any) => Promise<void>
}

export function ReviewModal({ open, onOpenChange, review, onUpdate }: ReviewModalProps) {
  const [bookTitle, setBookTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: "pending",
    comment: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (review && open) {
      setFormData({
        status: review.status || "pending",
        comment: review.comment || "",
      })
      loadBookTitle(review.bookId)
    }
  }, [review, open])

  const loadBookTitle = async (bookId: string) => {
    try {
      const bookDoc = await getDoc(doc(db, "books", bookId))
      if (bookDoc.exists()) {
        setBookTitle(bookDoc.data().title)
      }
    } catch (error) {
      console.error("Error loading book title:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!review || !onUpdate) return

    setLoading(true)
    try {
      await onUpdate(review.id, {
        status: formData.status,
        comment: formData.comment,
      })

      toast({
        title: "Success",
        description: "Review updated successfully",
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update review",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-5 w-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
      />
    ))
  }

  if (!review) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Review Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Book
              </Label>
              <p className="text-sm text-muted-foreground">{bookTitle || "Loading..."}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Reviewer
              </Label>
              <p className="text-sm text-muted-foreground">{review.userName}</p>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {renderStars(review.rating)}
                <span className="text-sm text-muted-foreground">({review.rating}/5)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <p className="text-sm text-muted-foreground">
                {review.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Review Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Review Comment</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Review comment..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 