"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Upload, BookOpen, User, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { createAuthorAccount, upgradeCustomerToAuthor, uploadAuthorFile, submitAuthorBook } from "@/lib/author-utils"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function NewAuthorPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [existingUser, setExistingUser] = useState<any>(null)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Check if user is already logged in and get their profile
  useEffect(() => {
    const checkExistingUser = async () => {
      if (user) {
        try {
          // Get user profile from userProfiles collection
          const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid))
          if (userProfileDoc.exists()) {
            const userData = userProfileDoc.data()
            setExistingUser(userData)
            
            // Pre-fill form with existing user data
            setPersonalData({
              name: userData.displayName || userData.firstName + ' ' + userData.lastName || '',
              email: userData.email || '',
              mobile: userData.phone || '',
              phone: userData.phone || '',
              city: '',
              address: ''
            })
            
            // If user is already an author, redirect them
            if (userData.role === 'author') {
              toast({
                title: "Already an Author",
                description: "You are already registered as an author. Please use the author dashboard.",
                variant: "destructive"
              })
              navigate('/author/dashboard')
              return
            }
          }
        } catch (error) {
          console.error('Error checking existing user:', error)
        }
      }
      setIsCheckingUser(false)
    }

    checkExistingUser()
  }, [user, navigate, toast])

  // Form data
  const [personalData, setPersonalData] = useState({
    name: "",
    email: "",
    mobile: "",
    phone: "",
    city: "",
    address: ""
  })

  const [bookData, setBookData] = useState({
    title: "",
    category: "",
    pages: "",
    language: "",
    description: ""
  })

  const [files, setFiles] = useState({
    pdf: null as File | null,
    image: null as File | null,
    wordDoc: null as File | null
  })

  const [uploading] = useState({
    pdf: false,
    image: false,
    wordDoc: false
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

  const handlePersonalDataChange = (field: string, value: string) => {
    setPersonalData(prev => ({ ...prev, [field]: value }))
  }

  const handleBookDataChange = (field: string, value: string) => {
    setBookData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (type: 'pdf' | 'image' | 'wordDoc', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        const personalRequired = ['name', 'email', 'mobile', 'city', 'address']
        for (const field of personalRequired) {
          if (!personalData[field as keyof typeof personalData]) {
            toast({
              title: "Missing Information",
              description: `Please fill in ${field}`,
              variant: "destructive"
            })
            return false
          }
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(personalData.email)) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address",
            variant: "destructive"
          })
          return false
        }
        break
      case 2:
        const bookRequired = ['title', 'category', 'pages', 'language', 'description']
        for (const field of bookRequired) {
          if (!bookData[field as keyof typeof bookData]) {
            toast({
              title: "Missing Information",
              description: `Please fill in ${field}`,
              variant: "destructive"
            })
            return false
          }
        }
        break
      case 3:
        if (!files.wordDoc) {
          toast({
            title: "Missing Files",
            description: "Please upload the Word document",
            variant: "destructive"
          })
          return false
        }
        break
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
    if (!validateStep(3)) return

    setIsSubmitting(true)
    try {
      let authorId: string

      // Check if user is already logged in and is a customer
      if (user && existingUser && existingUser.role === 'customer') {
        // Upgrade existing customer to author
        console.log('Upgrading existing customer to author')
        const result = await upgradeCustomerToAuthor(personalData, user.uid)
        authorId = result.existingUserId
        
        toast({
          title: "Account Upgraded!",
          description: "Your customer account has been upgraded to author status.",
        })
      } else {
        // Create new author account
        console.log('Creating new author account')
        const { authUser } = await createAuthorAccount(personalData)
        authorId = authUser.user.uid
        
        toast({
          title: "Account Created!",
          description: "Your author account has been created successfully.",
        })
      }

      // Upload files
      const [pdfUrl, imageUrl, wordDocUrl] = await Promise.all([
        uploadAuthorFile(files.pdf!, 'pdfs', authorId),
        uploadAuthorFile(files.image!, 'images', authorId),
        files.wordDoc ? uploadAuthorFile(files.wordDoc, 'docs', authorId) : Promise.resolve('')
      ])

      // Submit book for review
      await submitAuthorBook({
        ...bookData,
        authorName: personalData.name,
        pages: parseInt(bookData.pages),
        pdfUrl,
        imageUrl,
        wordDocUrl
      }, authorId)

      toast({
        title: "Submission Successful!",
        description: "Your book has been submitted for review. You will receive an email with further instructions.",
      })

      // Redirect based on user status
      if (user && existingUser) {
        // User was already logged in, redirect to author dashboard
        navigate('/author/dashboard')
      } else {
        // New user, redirect to login page
        navigate('/auth/login')
      }

    } catch (error: any) {
      console.error('Submission error:', error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit your application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while checking user status
  if (isCheckingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your account status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Become an Author</h1>
            <p className="text-muted-foreground">
              {existingUser ? 
                "Upgrade your account and share your story with the world" : 
                "Join DNA Publications and share your story with the world"
              }
            </p>
            {existingUser && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Welcome back!</strong> We found your existing account. Your information has been pre-filled. 
                  You can update any details before submitting your author application.
                </p>
              </div>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[
              { step: 1, label: "Personal Details", icon: User },
              { step: 2, label: "Book Details", icon: BookOpen },
              { step: 3, label: "File Upload", icon: FileText }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
                <span className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Step {currentStep}: {
                  currentStep === 1 ? "Personal Details" :
                  currentStep === 2 ? "Book Details" :
                  "File Upload"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={personalData.name}
                      onChange={(e) => handlePersonalDataChange('name', e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalData.email}
                        onChange={(e) => handlePersonalDataChange('email', e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number *</Label>
                      <Input
                        id="mobile"
                        value={personalData.mobile}
                        onChange={(e) => handlePersonalDataChange('mobile', e.target.value)}
                        placeholder="Mobile number"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={personalData.phone}
                        onChange={(e) => handlePersonalDataChange('phone', e.target.value)}
                        placeholder="Landline number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={personalData.city}
                        onChange={(e) => handlePersonalDataChange('city', e.target.value)}
                        placeholder="Your city"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={personalData.address}
                      onChange={(e) => handlePersonalDataChange('address', e.target.value)}
                      placeholder="Your complete address"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Book Details */}
              {currentStep === 2 && (
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
                </div>
              )}

              {/* Step 3: File Upload */}
              {currentStep === 3 && (
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
                        disabled={uploading.wordDoc}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading.wordDoc ? "Uploading..." : "Upload Word Document"}
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
                        disabled={uploading.pdf}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading.pdf ? "Uploading..." : "Upload Book PDF"}
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
                        disabled={uploading.image}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading.image ? "Uploading..." : "Upload Cover Image"}
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

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Your submission will be reviewed by our editorial team</li>
                      <li>• You'll receive an email with the review status</li>
                      <li>• If approved, you'll be asked to complete the payment</li>
                      <li>• Your book will then go through editing and proofreading</li>
                      <li>• Once completed, your book will be published on our platform</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
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
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : existingUser ? "Upgrade to Author & Submit" : "Submit Application"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}