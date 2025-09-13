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
    weight: "",
    length: "",
    width: "",
    height: "",
    edition: "",
    year: "",
    isbn: "",
    pages: "",
    format: "",
    language: "",
    publisher: "",
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
        weight: book.weight?.toString() || "",
        length: book.length?.toString() || "",
        width: book.width?.toString() || "",
        height: book.height?.toString() || "",
        edition: book.edition || "",
        year: book.year || "",
        isbn: book.isbn || "",
        pages: book.pages || "",
        format: book.format || "",
        language: book.language || "",
        publisher: book.publisher || "",
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
        weight: "",
        length: "",
        width: "",
        height: "",
        edition: "",
        year: "",
        isbn: "",
        pages: "",
        format: "",
        language: "",
        publisher: "",
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
        weight: parseFloat(formData.weight) || 0,
        length: parseFloat(formData.length) || 0,
        width: parseFloat(formData.width) || 0,
        height: parseFloat(formData.height) || 0,
        edition: formData.edition,
        year: formData.year,
        isbn: formData.isbn,
        pages: formData.pages,
        format: formData.format,
        language: formData.language,
        publisher: formData.publisher,
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

          {/* Additional Book Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Additional Book Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edition">Edition</Label>
                <Input
                  id="edition"
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  placeholder="e.g., 1st Edition, 2nd Edition"
                />
              </div>
              <div>
                <Label htmlFor="year">Publication Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g., 2024"
                  min="1900"
                  max="2030"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="e.g., 978-0-123456-78-9"
                />
              </div>
              <div>
                <Label htmlFor="pages">Number of Pages *</Label>
                <Input
                  id="pages"
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="e.g., 250"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="format">Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => setFormData({ ...formData, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paperback">Paperback</SelectItem>
                    <SelectItem value="Hardcover">Hardcover</SelectItem>
                    <SelectItem value="E-book">E-book</SelectItem>
                    <SelectItem value="Audiobook">Audiobook</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                    <SelectItem value="Telugu">Telugu</SelectItem>
                    <SelectItem value="Kannada">Kannada</SelectItem>
                    <SelectItem value="Malayalam">Malayalam</SelectItem>
                    <SelectItem value="Bengali">Bengali</SelectItem>
                    <SelectItem value="Marathi">Marathi</SelectItem>
                    <SelectItem value="Gujarati">Gujarati</SelectItem>
                    <SelectItem value="Punjabi">Punjabi</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                placeholder="Publisher name"
              />
            </div>

            {/* Shipping Details Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Shipping Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (KG) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  {/* Empty div for grid layout */}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="length">Length (CM) *</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (CM) *</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (CM) *</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="0.0"
                    required
                  />
                </div>
              </div>
            </div>
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