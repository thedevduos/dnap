"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Upload, BookOpen, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { submitAuthorBook, uploadAuthorFile } from "@/lib/author-utils"

interface NewBookModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewBookModal({ open, onOpenChange }: NewBookModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const [bookData, setBookData] = useState({
    title: "",
    category: "",
    pages: "",
    language: "",
    description: "",
    edition: "",
    year: "",
    isbn: "",
    format: "",
    publisher: ""
  })

  const [files, setFiles] = useState({
    pdf: null as File | null,
    image: null as File | null,
    wordDoc: null as File | null
  })

  const categories = [
    "Fiction", "Non-Fiction", "Poetry", "Biography", "Science", 
    "History", "Romance", "Mystery", "Sci-Fi", "Fantasy", 
    "Self-Help", "Academic Books", "Law Books", "Business", "Health", "Travel", "Children"
  ]

  const languages = [
    "English", "Hindi", "Tamil", "Telugu", "Kannada", 
    "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi"
  ]

  const handleBookDataChange = (field: string, value: string) => {
    setBookData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (type: 'pdf' | 'image' | 'wordDoc', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }))
  }

  const validateStep = (step: number) => {
    if (step === 1) {
      const required = ['title', 'category', 'pages', 'language', 'description']
      for (const field of required) {
        if (!bookData[field as keyof typeof bookData]) {
          toast({
            title: "Missing Information",
            description: `Please fill in ${field}`,
            variant: "destructive"
          })
          return false
        }
      }
    } else if (step === 2) {
      if (!files.wordDoc) {
        toast({
          title: "Missing Files",
          description: "Please upload the Word document",
          variant: "destructive"
        })
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(2) || !user) return

    setIsSubmitting(true)
    try {
      const authorId = user.uid

      // Upload files
      const [pdfUrl, imageUrl, wordDocUrl] = await Promise.all([
        uploadAuthorFile(files.pdf!, 'pdfs', authorId),
        uploadAuthorFile(files.image!, 'images', authorId),
        files.wordDoc ? uploadAuthorFile(files.wordDoc, 'docs', authorId) : Promise.resolve('')
      ])

      // Submit book for review
      await submitAuthorBook({
        ...bookData,
        authorName: user.displayName || user.email?.split('@')[0] || 'Author',
        pages: parseInt(bookData.pages),
        pdfUrl,
        imageUrl,
        wordDocUrl
      }, authorId)

      toast({
        title: "Book Submitted!",
        description: "Your book has been submitted for review.",
      })

      onOpenChange(false)
      // Reset form
      setCurrentStep(1)
      setBookData({
        title: "",
        category: "",
        pages: "",
        language: "",
        description: "",
        edition: "",
        year: "",
        isbn: "",
        format: "",
        publisher: ""
      })
      setFiles({
        pdf: null,
        image: null,
        wordDoc: null
      })

    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit book. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Another Book</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 1, label: "Book Details", icon: BookOpen },
              { step: 2, label: "File Upload", icon: FileText }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                {step < 2 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
                <span className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Book Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={bookData.title}
                  onChange={(e) => handleBookDataChange('title', e.target.value)}
                  placeholder="Your book title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={bookData.category}
                  onValueChange={(value) => handleBookDataChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pages">Number of Pages *</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={bookData.pages}
                    onChange={(e) => handleBookDataChange('pages', e.target.value)}
                    placeholder="Total pages"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="language">Language *</Label>
                  <Select
                    value={bookData.language}
                    onValueChange={(value) => handleBookDataChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(language => (
                        <SelectItem key={language} value={language}>{language}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Book Description *</Label>
                <Textarea
                  id="description"
                  value={bookData.description}
                  onChange={(e) => handleBookDataChange('description', e.target.value)}
                  placeholder="Describe your book..."
                  rows={4}
                  required
                />
              </div>

              {/* Additional Book Details */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Additional Book Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edition">Edition</Label>
                    <Input
                      id="edition"
                      value={bookData.edition}
                      onChange={(e) => handleBookDataChange('edition', e.target.value)}
                      placeholder="e.g., 1st Edition, 2nd Edition"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Publication Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={bookData.year}
                      onChange={(e) => handleBookDataChange('year', e.target.value)}
                      placeholder="e.g., 2024"
                      min="1900"
                      max="2030"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={bookData.isbn}
                      onChange={(e) => handleBookDataChange('isbn', e.target.value)}
                      placeholder="e.g., 978-0-123456-78-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={bookData.format}
                      onValueChange={(value) => handleBookDataChange('format', value)}
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
                </div>

                <div className="mt-4">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={bookData.publisher}
                    onChange={(e) => handleBookDataChange('publisher', e.target.value)}
                    placeholder="Publisher name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Word Document Upload (Required) */}
              <div>
                <Label>Word Document *</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="wordDoc"
                    accept=".doc,.docx"
                    onChange={(e) => handleFileChange('wordDoc', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("wordDoc")?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Word Document
                  </Button>
                  {files.wordDoc && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {files.wordDoc.name} selected
                    </p>
                  )}
                </div>
              </div>

              {/* PDF Upload (Optional) */}
              <div>
                <Label>Book PDF (Optional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="pdf"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('pdf', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("pdf")?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Book PDF
                  </Button>
                  {files.pdf && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {files.pdf.name} selected
                    </p>
                  )}
                </div>
              </div>

              {/* Cover Image Upload (Optional) */}
              <div>
                <Label>Cover Image (Optional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={(e) => handleFileChange('image', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image")?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Cover Image
                  </Button>
                  {files.image && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">✓ {files.image.name} selected</p>
                      <img
                        src={URL.createObjectURL(files.image)}
                        alt="Cover preview"
                        className="w-32 h-40 object-cover rounded mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
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
            
            {currentStep < 2 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Book"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}