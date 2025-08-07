"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { addBook, updateBook, uploadImage, uploadBookPDF } from "@/lib/firebase-utils"
import { useEbookPlans } from "@/hooks/use-ebook-plans"
import { Upload, ArrowLeft, ArrowRight, FileText, Image } from "lucide-react"

interface EnhancedBookModalProps {
  isOpen: boolean
  onClose: () => void
  book?: any | null
}

export function EnhancedBookModal({ isOpen, onClose, book }: EnhancedBookModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    price: "",
    description: "",
    imageUrl: "",
    status: "published",
    rating: "4.5",
    pdfUrl: "",
    pdfSize: 0,
    ebookVisibility: {
      general: false,
      singleEbooks: false,
      plans: [] as string[]
    }
  })
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [_pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPdfUploading, setIsPdfUploading] = useState(false)
  const { toast } = useToast()
  const { plans } = useEbookPlans()

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
        rating: book.rating?.toString() || "4.5",
        pdfUrl: book.pdfUrl || "",
        pdfSize: book.pdfSize || 0,
        ebookVisibility: book.ebookVisibility || {
          general: false,
          singleEbooks: false,
          plans: []
        }
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
        pdfUrl: "",
        pdfSize: 0,
        ebookVisibility: {
          general: false,
          singleEbooks: false,
          plans: []
        }
      })
    }
    setImageFile(null)
    setPdfFile(null)
    setCurrentStep(1)
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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "PDF file must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setPdfFile(file)
    setIsPdfUploading(true)

    try {
      const pdfUrl = await uploadBookPDF(file, book?.id || `temp_${Date.now()}`)
      setFormData({ 
        ...formData, 
        pdfUrl,
        pdfSize: file.size
      })
      toast({
        title: "Success",
        description: "PDF uploaded successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPdfUploading(false)
    }
  }

  const handlePlanToggle = (planId: string) => {
    const currentPlans = formData.ebookVisibility.plans
    const updatedPlans = currentPlans.includes(planId)
      ? currentPlans.filter(id => id !== planId)
      : [...currentPlans, planId]
    
    setFormData({
      ...formData,
      ebookVisibility: {
        ...formData.ebookVisibility,
        plans: updatedPlans
      }
    })
  }

  const nextStep = () => {
    if (currentStep < 3) {
      // If moving to step 3 (PDF upload), ensure previous steps are completed
      if (currentStep === 2) {
        // Check if at least one visibility option is selected
        const hasVisibility = formData.ebookVisibility.general || 
                             formData.ebookVisibility.singleEbooks || 
                             formData.ebookVisibility.plans.length > 0
        
        if (!hasVisibility) {
          toast({
            title: "Visibility Required",
            description: "Please select at least one visibility option before proceeding.",
            variant: "destructive",
          })
          return
        }
      }
      
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that PDF is uploaded
    if (!formData.pdfUrl) {
      toast({
        title: "PDF Required",
        description: "Please upload a PDF file before saving the book.",
        variant: "destructive",
      })
      return
    }

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
        pdfUrl: formData.pdfUrl,
        pdfSize: formData.pdfSize,
        ebookVisibility: formData.ebookVisibility,
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
            Complete all steps to create a book. PDF upload is required in the final step.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 1, label: "Basic Details" },
              { step: 2, label: "Visibility" },
              { step: 3, label: "PDF Upload*" }
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
                <span className={`ml-2 text-xs ${
                  currentStep >= step ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Details */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Basic Details
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
                          <SelectItem value="Poetry">Poetry</SelectItem>
                          <SelectItem value="Biography">Biography</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="History">History</SelectItem>
                          <SelectItem value="Romance">Romance</SelectItem>
                          <SelectItem value="Mystery">Mystery</SelectItem>
                          <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                          <SelectItem value="Fantasy">Fantasy</SelectItem>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </SelectContent>
                      </Select>
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
                </CardContent>
              </Card>
            )}

            {/* Step 2: E-book Visibility */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>E-book Visibility Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="general"
                        checked={formData.ebookVisibility.general}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            ebookVisibility: {
                              ...formData.ebookVisibility,
                              general: checked as boolean
                            }
                          })
                        }
                      />
                      <Label htmlFor="general" className="text-sm font-medium">
                        General (Available for multiple e-book plans)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="singleEbooks"
                        checked={formData.ebookVisibility.singleEbooks}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            ebookVisibility: {
                              ...formData.ebookVisibility,
                              singleEbooks: checked as boolean
                            }
                          })
                        }
                      />
                      <Label htmlFor="singleEbooks" className="text-sm font-medium">
                        Single E-books (Available for single e-book plans)
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-4 block">
                      Specific Plan Visibility
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plans.map((plan) => (
                        <div key={plan.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            id={`plan-${plan.id}`}
                            checked={formData.ebookVisibility.plans.includes(plan.id)}
                            onCheckedChange={() => handlePlanToggle(plan.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`plan-${plan.id}`} className="text-sm font-medium">
                              {plan.title}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {plan.description} - ₹{plan.price}{plan.period}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: PDF Upload */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Book PDF Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="pdf">Book PDF (Max 10MB) *</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="pdf"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("pdf")?.click()}
                        disabled={isPdfUploading}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isPdfUploading ? "Uploading PDF..." : "Upload Book PDF"}
                      </Button>
                      
                      {formData.pdfUrl && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-800">PDF Uploaded Successfully</p>
                              <p className="text-xs text-green-600">
                                Size: {(formData.pdfSize / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!formData.pdfUrl && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">PDF Upload Required</p>
                              <p className="text-xs text-yellow-600">
                                You must upload a PDF file to save this book
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload the PDF version of your book. Maximum file size: 10MB. <strong>PDF upload is required.</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isUploading || isPdfUploading || !formData.pdfUrl}
                >
                  {isSubmitting ? "Saving..." : book ? "Update Book" : "Add Book"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}