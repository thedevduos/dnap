"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addBook, updateBook, uploadImage } from "@/lib/firebase-utils"
import { Upload } from "lucide-react"

interface BookModalProps {
  isOpen: boolean
  onClose: () => void
  book?: any | null
}

export function BookModal({ isOpen, onClose, book }: BookModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    price: "",
    description: "",
    imageUrl: "",
    status: "published",
    rating: "4.5",
  })
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || "",
        author: book.author || "",
        category: book.category || "",
        price: book.price?.toString() || "",
        description: book.description || "",
        imageUrl: book.imageUrl || "",
        status: book.status || "published",
        rating: book.rating?.toString(),
      })
    } else {
      setFormData({
        title: "",
        author: "",
        category: "",
        price: "",
        description: "",
        imageUrl: "",
        status: "published",
        rating: "4.5",
      })
    }
    setImageFile(null)
  }, [book, isOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setIsUploading(true)

    try {
      const imageUrl = await uploadImage(file, "books")
      setFormData({ ...formData, imageUrl })
      toast({
        title: "Success",
        description: "Cover image uploaded successfully!",
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
      const bookData = {
        title: formData.title,
        author: formData.author,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description,
        imageUrl: formData.imageUrl,
        status: formData.status,
        rating: parseFloat(formData.rating),
      }

      if (book) {
        await updateBook(book.id, bookData)
        toast({
          title: "Success",
          description: "Book updated successfully!",
        })
      } else {
        await addBook(bookData)
        toast({
          title: "Success",
          description: "Book added successfully!",
        })
      }

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save book. Please try again.",
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
          <DialogTitle>{book ? "Edit Book" : "Add New Book"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Book title"
                required
              />
            </div>
            <div>
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Author name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fiction">Fiction</SelectItem>
                  <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                  <SelectItem value="Poetry">Poetry</SelectItem>
                  <SelectItem value="Biography">Biography</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Romance">Romance</SelectItem>
                  <SelectItem value="Mystery">Mystery</SelectItem>
                  <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                  <SelectItem value="Fantasy">Fantasy</SelectItem>
                  <SelectItem value="Self-Help">Self-Help</SelectItem>
                  <SelectItem value="Academic Books">Academic Books</SelectItem>
                  <SelectItem value="Law Books">Law Books</SelectItem>
                </SelectContent>
              </Select>
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

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Book description..."
              rows={4}
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
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rating">Star Rating *</Label>
            <Select
              value={formData.rating}
              onValueChange={(value) => setFormData({ ...formData, rating: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5.0</SelectItem>
                <SelectItem value="4.5">4.5</SelectItem>
                <SelectItem value="4">4.0</SelectItem>
                <SelectItem value="3.5">3.5</SelectItem>
                <SelectItem value="3">3.0</SelectItem>
                <SelectItem value="2.5">2.5</SelectItem>
                <SelectItem value="2">2.0</SelectItem>
                <SelectItem value="1.5">1.5</SelectItem>
                <SelectItem value="1">1.0</SelectItem>
                <SelectItem value="0.5">0.5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cover">Cover Image</Label>
            <div className="mt-2">
              <input
                type="file"
                id="cover"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("cover")?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Cover Image"}
              </Button>
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Cover preview"
                    className="w-32 h-40 object-cover rounded"
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
              {isSubmitting ? "Saving..." : book ? "Update Book" : "Add Book"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}