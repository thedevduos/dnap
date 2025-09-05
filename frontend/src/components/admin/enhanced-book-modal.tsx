"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { addBook, updateBook, uploadImage } from "@/lib/firebase-utils"
import { Upload, Image } from "lucide-react"

interface EnhancedBookModalProps {
  isOpen: boolean
  onClose: () => void
  book?: any | null
}

export function EnhancedBookModal({ isOpen, onClose, book }: EnhancedBookModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    authorId: "",
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

  // Initialize form data when modal opens or book changes
  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || "",
        author: book.author || "",
        authorId: book.authorId || "",
        category: book.category || "",
        price: book.price?.toString() || "",
        description: book.description || "",
        imageUrl: book.imageUrl || "",
        status: book.status || "published",
        rating: book.rating?.toString() || "4.5",
      })
    } else {
      setFormData({
        title: "",
        author: "",
        authorId: "",
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

    setIsUploading(true)
    try {
      const imageUrl = await uploadImage(file, "book-covers")
      setFormData({ ...formData, imageUrl })
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
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
        authorId: formData.authorId,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? "Edit Book" : "Add New Book"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {book ? "Update the book details below." : "Complete the form to add a new book."}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Book Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        <SelectItem value="Mystery">Mystery</SelectItem>
                        <SelectItem value="Romance">Romance</SelectItem>
                        <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                        <SelectItem value="Fantasy">Fantasy</SelectItem>
                        <SelectItem value="Thriller">Thriller</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Self-Help">Self-Help</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Poetry">Poetry</SelectItem>
                        <SelectItem value="Children">Children</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
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
                    placeholder="Book description"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating *</Label>
                    <Select
                      value={formData.rating}
                      onValueChange={(value) => setFormData({ ...formData, rating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.0">1.0</SelectItem>
                        <SelectItem value="1.5">1.5</SelectItem>
                        <SelectItem value="2.0">2.0</SelectItem>
                        <SelectItem value="2.5">2.5</SelectItem>
                        <SelectItem value="3.0">3.0</SelectItem>
                        <SelectItem value="3.5">3.5</SelectItem>
                        <SelectItem value="4.0">4.0</SelectItem>
                        <SelectItem value="4.5">4.5</SelectItem>
                        <SelectItem value="5.0">5.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image">Book Cover Image</Label>
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
                      onClick={() => document.getElementById('image')?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Cover Image"}
                    </Button>
                  </div>
                  
                  {formData.imageUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Current cover:</p>
                      <div className="flex justify-center">
                        <img
                          src={formData.imageUrl}
                          alt="Cover preview"
                          className="w-32 h-40 object-cover rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Buttons */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? "Saving..." : book ? "Update Book" : "Add Book"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EnhancedBookModal