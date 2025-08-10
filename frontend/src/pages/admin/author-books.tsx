"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Eye, DollarSign, Check, X, LinkIcon, Trash2, ArrowLeft, ArrowRight, Upload, FileText } from "lucide-react"
import { useAllAuthorBooks } from "@/hooks/use-all-author-books"
import { updateAuthorBookStage, sendAuthorNotification, revokeAuthorAccess, deleteAuthorBook } from "@/lib/author-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEbookPlans } from "@/hooks/use-ebook-plans"
import { uploadBookPDF } from "@/lib/firebase-utils"

export default function AdminAuthorBooks() {
  const { books, loading } = useAllAuthorBooks()
  const { plans } = useEbookPlans()
  const { toast } = useToast()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentScreenshotModal, setShowPaymentScreenshotModal] = useState(false)
  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [showBookCreationModal, setShowBookCreationModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [bookCreationData, setBookCreationData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
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
  const [_pdfFile, setPdfFile] = useState<File | null>(null)
  const [isPdfUploading, setIsPdfUploading] = useState(false)

  const handleViewDetails = (book: any) => {
    setSelectedBook(book)
    setShowDetailsModal(true)
  }

  const handleCollectPayment = (book: any) => {
    setSelectedBook(book)
    setShowPaymentModal(true)
  }

  const handleViewPaymentScreenshot = (book: any) => {
    setSelectedBook(book)
    setShowPaymentScreenshotModal(true)
  }

  const handleManageAffiliateLinks = (book: any) => {
    setSelectedBook(book)
    setShowAffiliateModal(true)
  }

  const handleSetPaymentAmount = async () => {
    if (!selectedBook || !paymentAmount) return

    try {
      await updateAuthorBookStage(selectedBook.id, 'payment', {
        paymentAmount: parseFloat(paymentAmount)
      })

      // Send notification to author
      if (selectedBook.authorEmail) {
        await sendAuthorNotification(
          selectedBook.authorEmail,
          'payment',
          selectedBook.title,
          { amount: paymentAmount }
        )
      }

      toast({
        title: "Payment Amount Set",
        description: "Author has been notified about the payment requirement.",
      })

      setShowPaymentModal(false)
      setPaymentAmount("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set payment amount.",
        variant: "destructive"
      })
    }
  }

  const handleVerifyPayment = async (book: any) => {
    try {
      await updateAuthorBookStage(book.id, 'editing', {
        paymentStatus: 'verified'
      })

      // Create Jira project
      const projectKey = book.title.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')
      const projectName = `${book.title} - ${book.authorName}`

      // Call backend to create Jira project
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/jira/create-project`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectKey,
            projectName
          })
        })

        if (response.ok) {
          const result = await response.json()
          await updateAuthorBookStage(book.id, 'editing', {
            jiraProjectKey: projectKey,
            jiraProjectId: result.data?.id
          })
        }
      } catch (jiraError) {
        console.error('Failed to create Jira project:', jiraError)
      }

      // Send notification to author
      if (book.authorEmail) {
        await sendAuthorNotification(
          book.authorEmail,
          'editing',
          book.title
        )
      }

      toast({
        title: "Payment Verified",
        description: "Book moved to editing stage and Jira project created.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify payment.",
        variant: "destructive"
      })
    }
  }

  const handleCompleteBook = async (book: any) => {
    setSelectedBook(book)
    setBookCreationData({
      title: book.title,
      price: "",
      description: book.description,
      category: book.category,
      status: "published",
      rating: "4.5",
      pdfUrl: book.pdfUrl || "",
      pdfSize: book.pdfSize || 0,
      ebookVisibility: {
        general: false,
        singleEbooks: false,
        plans: []
      }
    })
    setCurrentStep(1)
    setShowBookCreationModal(true)
  }

  const handlePlanToggle = (planId: string) => {
    const currentPlans = bookCreationData.ebookVisibility.plans
    const updatedPlans = currentPlans.includes(planId)
      ? currentPlans.filter(id => id !== planId)
      : [...currentPlans, planId]
    
    setBookCreationData({
      ...bookCreationData,
      ebookVisibility: {
        ...bookCreationData.ebookVisibility,
        plans: updatedPlans
      }
    })
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
      const pdfUrl = await uploadBookPDF(file, selectedBook?.id || `temp_${Date.now()}`)
      setBookCreationData({ 
        ...bookCreationData, 
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

  const nextStep = () => {
    if (currentStep < 3) {
      // Validate book details
      if (currentStep === 1) {
        if (!bookCreationData.title || !bookCreationData.price || !bookCreationData.description || !bookCreationData.category) {
          toast({
            title: "Required Fields Missing",
            description: "Please fill in all required fields before proceeding.",
            variant: "destructive",
          })
          return
        }
      }
      
      // Validate visibility settings
      if (currentStep === 2) {
        const hasVisibility = bookCreationData.ebookVisibility.general || 
                             bookCreationData.ebookVisibility.singleEbooks || 
                             bookCreationData.ebookVisibility.plans.length > 0
        
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

  const handleCloseBookCreationModal = () => {
    setShowBookCreationModal(false)
    setCurrentStep(1)
  }

  const handleCreateBook = async () => {
    if (!selectedBook || !bookCreationData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    // Validate that PDF is uploaded
    if (!bookCreationData.pdfUrl) {
      toast({
        title: "PDF Required",
        description: "Please upload a PDF file before saving the book.",
        variant: "destructive",
      })
      return
    }

    // Check if at least one visibility option is selected
    const hasVisibility = bookCreationData.ebookVisibility.general || 
                         bookCreationData.ebookVisibility.singleEbooks || 
                         bookCreationData.ebookVisibility.plans.length > 0
    
    if (!hasVisibility) {
      toast({
        title: "Visibility Required",
        description: "Please select at least one visibility option before publishing.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create the book in the books collection
      const bookData = {
        title: bookCreationData.title,
        author: selectedBook.authorName,
        authorId: selectedBook.authorId,
        category: bookCreationData.category,
        price: parseFloat(bookCreationData.price),
        description: bookCreationData.description,
        imageUrl: selectedBook.imageUrl,
        pdfUrl: bookCreationData.pdfUrl,
        pdfSize: bookCreationData.pdfSize,
        status: bookCreationData.status,
        rating: parseFloat(bookCreationData.rating),
        ebookVisibility: bookCreationData.ebookVisibility,
        createdAt: new Date(),
      }

      // Add book to books collection
      const bookRef = await addDoc(collection(db, "books"), bookData)

      // Update author book with the assigned book ID
      await updateAuthorBookStage(selectedBook.id, 'completed', {
        assignedBookId: bookRef.id
      })

      // Send completion notification
      if (selectedBook.authorEmail) {
        await sendAuthorNotification(
          selectedBook.authorEmail,
          'completed',
          selectedBook.title
        )
      }

      // Send thank you email
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/authors/send-thank-you-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorEmail: selectedBook.authorEmail,
            authorName: selectedBook.authorName,
            bookTitle: selectedBook.title
          })
        })

        if (response.ok) {
          console.log('Thank you email sent successfully')
        }
      } catch (emailError) {
        console.error('Failed to send thank you email:', emailError)
      }

      toast({
        title: "Book Published Successfully",
        description: "Book has been created and published with visibility settings. Author has been notified.",
      })

      handleCloseBookCreationModal()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create book. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRejectBook = async (book: any) => {
    if (window.confirm(`Are you sure you want to reject "${book.title}"? This will revoke the author's dashboard access and change their role to customer. This action cannot be undone.`)) {
      try {
        // Revoke author access and change role to customer
        if (!book.authorEmail) {
          toast({
            title: "Error",
            description: "Cannot reject book: Author email not found.",
            variant: "destructive"
          })
          return
        }
        
        const result = await revokeAuthorAccess(book.authorId, book.authorEmail)

        // Send rejection notification
        await sendAuthorNotification(
          book.authorEmail,
          'rejected',
          book.title
        )

        // Send access revocation notification
        await sendAuthorNotification(
          book.authorEmail,
          'access_revoked',
          book.title
        )

        toast({
          title: "Book Rejected",
          description: `Author access has been revoked and role changed to customer. ${result.booksDeleted} book(s) deleted.`,
        })
      } catch (error) {
        console.error('Error rejecting book:', error)
        toast({
          title: "Error",
          description: "Failed to reject book and revoke author access.",
          variant: "destructive"
        })
      }
    }
  }

  const handleDeleteBook = async () => {
    if (!selectedBook) return

    try {
      const result = await deleteAuthorBook(selectedBook.id)

      let description = `"${selectedBook.title}" has been permanently deleted.`
      if (result.mainBookDeleted) {
        description += " The published book and all related data (ebooks, reviews, affiliate links, etc.) have also been deleted."
      }

      toast({
        title: "Book Deleted",
        description: description,
      })

      setShowDeleteModal(false)
      setSelectedBook(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete book.",
        variant: "destructive"
      })
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "review": return "bg-yellow-100 text-yellow-800"
      case "payment": return "bg-orange-100 text-orange-800"
      case "payment_verification": return "bg-blue-100 text-blue-800"
      case "editing": return "bg-purple-100 text-purple-800"
      case "completed": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "review": return "Under Review"
      case "payment": return "Payment Required"
      case "payment_verification": return "Payment Verification"
      case "editing": return "Editing in Progress"
      case "completed": return "Published"
      default: return stage
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Author Books Management</h1>
            <p className="text-gray-600">Review and manage author book submissions</p>
          </div>
        </div>

        {/* Books Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Author Books ({books.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading author books...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No author books found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cover</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <img
                          src={book.imageUrl}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.authorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{book.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStageColor(book.stage)}>
                          {getStageLabel(book.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {book.paymentAmount ? `₹${book.paymentAmount}` : 'Not set'}
                      </TableCell>
                      <TableCell>
                        {book.createdAt?.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(book)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          
                          {book.stage === 'review' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCollectPayment(book)}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Collect Payment
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectBook(book)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {book.stage === 'payment_verification' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewPaymentScreenshot(book)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Screenshot
                              </Button>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleVerifyPayment(book)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Verify Payment
                              </Button>
                            </>
                          )}
                          
                          {book.stage === 'editing' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleCompleteBook(book)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Complete
                            </Button>
                          )}

                          {book.stage === 'completed' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleManageAffiliateLinks(book)}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Affiliate Links
                              </Button>
                            </>
                          )}
                          
                          {/* Delete button - available for all stages */}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setSelectedBook(book)
                              setShowDeleteModal(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Book Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book Details</DialogTitle>
            </DialogHeader>
            {selectedBook && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <img
                      src={selectedBook.imageUrl}
                      alt={selectedBook.title}
                      className="w-full h-64 object-cover rounded"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{selectedBook.title}</h3>
                      <p className="text-muted-foreground">by {selectedBook.authorName}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Category:</strong> {selectedBook.category}</p>
                      <p><strong>Genre:</strong> {selectedBook.genre}</p>
                      <p><strong>Pages:</strong> {selectedBook.pages}</p>
                      <p><strong>Language:</strong> {selectedBook.language}</p>
                    </div>
                    <div>
                      <strong>Description:</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedBook.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href={selectedBook.pdfUrl} target="_blank" rel="noopener noreferrer">
                      View PDF
                    </a>
                  </Button>
                  {selectedBook.wordDocUrl && (
                    <Button variant="outline" asChild>
                      <a href={selectedBook.wordDocUrl} target="_blank" rel="noopener noreferrer">
                        View Word Doc
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Payment Amount</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Payment Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetPaymentAmount} className="flex-1">
                  Set Amount
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Screenshot Modal */}
        <Dialog open={showPaymentScreenshotModal} onOpenChange={setShowPaymentScreenshotModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Payment Screenshot - {selectedBook?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Book Details:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Author:</span> {selectedBook?.authorName}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> ₹{selectedBook?.paymentAmount}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge className="ml-2 bg-blue-600">Payment Submitted</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span> {selectedBook?.updatedAt?.toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {selectedBook?.paymentScreenshot && (
                <div>
                  <h4 className="font-semibold mb-2">Payment Screenshot:</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {selectedBook.paymentScreenshot.endsWith('.pdf') ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">PDF Document</p>
                        <Button asChild>
                          <a href={selectedBook.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                            View PDF
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <img 
                        src={selectedBook.paymentScreenshot} 
                        alt="Payment Screenshot"
                        className="max-w-full h-auto rounded-lg border"
                      />
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentScreenshotModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  handleVerifyPayment(selectedBook)
                  setShowPaymentScreenshotModal(false)
                }}>
                  <Check className="h-4 w-4 mr-2" />
                  Verify Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Affiliate Links Management Modal */}
        <Dialog open={showAffiliateModal} onOpenChange={setShowAffiliateModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Affiliate Links - {selectedBook?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Book Details:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Author:</span> {selectedBook?.authorName}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge className="ml-2 bg-green-600">Published</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Affiliate Links:</h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Authors can create affiliate links for this book. These links include coupon codes and track sales.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Affiliate Link Features:</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Automatic coupon code generation</li>
                      <li>• Sales tracking and analytics</li>
                      <li>• Commission tracking for authors</li>
                      <li>• Admin approval system</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAffiliateModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  // Navigate to affiliate management page or open detailed view
                  setShowAffiliateModal(false)
                  toast({
                    title: "Affiliate Management",
                    description: "Affiliate link management is handled through the author dashboard.",
                  })
                }}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Book Creation Modal */}
        <Dialog open={showBookCreationModal} onOpenChange={handleCloseBookCreationModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark as Complete - {selectedBook?.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Complete all steps to publish the book. The book will be automatically assigned to the author.
              </p>
            </DialogHeader>

            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-center space-x-4">
                {[
                  { step: 1, label: "Book Details" },
                  { step: 2, label: "E-book Visibility" },
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

              {/* Step 1: Book Details */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Book Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Author Book Details:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Author:</span> {selectedBook?.authorName}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {selectedBook?.category}
                        </div>
                        <div>
                          <span className="font-medium">Pages:</span> {selectedBook?.pages}
                        </div>
                        <div>
                          <span className="font-medium">Language:</span> {selectedBook?.language}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bookTitle">Book Title *</Label>
                        <Input
                          id="bookTitle"
                          value={bookCreationData.title}
                          onChange={(e) => setBookCreationData({...bookCreationData, title: e.target.value})}
                          placeholder="Book title"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bookPrice">Price (₹) *</Label>
                        <Input
                          id="bookPrice"
                          type="number"
                          value={bookCreationData.price}
                          onChange={(e) => setBookCreationData({...bookCreationData, price: e.target.value})}
                          placeholder="Enter price"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bookCategory">Category *</Label>
                        <Input
                          id="bookCategory"
                          value={bookCreationData.category}
                          onChange={(e) => setBookCreationData({...bookCreationData, category: e.target.value})}
                          placeholder="Book category"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bookDescription">Description *</Label>
                        <Textarea
                          id="bookDescription"
                          value={bookCreationData.description}
                          onChange={(e) => setBookCreationData({...bookCreationData, description: e.target.value})}
                          placeholder="Book description"
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bookStatus">Status</Label>
                          <Select
                            value={bookCreationData.status}
                            onValueChange={(value) => setBookCreationData({...bookCreationData, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="bookRating">Rating</Label>
                          <Input
                            id="bookRating"
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={bookCreationData.rating}
                            onChange={(e) => setBookCreationData({...bookCreationData, rating: e.target.value})}
                            placeholder="4.5"
                          />
                        </div>
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
                          checked={bookCreationData.ebookVisibility.general}
                          onCheckedChange={(checked) => 
                            setBookCreationData({
                              ...bookCreationData,
                              ebookVisibility: {
                                ...bookCreationData.ebookVisibility,
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
                          checked={bookCreationData.ebookVisibility.singleEbooks}
                          onCheckedChange={(checked) => 
                            setBookCreationData({
                              ...bookCreationData,
                              ebookVisibility: {
                                ...bookCreationData.ebookVisibility,
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
                              checked={bookCreationData.ebookVisibility.plans.includes(plan.id)}
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
                        
                        {bookCreationData.pdfUrl && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-green-800">PDF Uploaded Successfully</p>
                                <p className="text-xs text-green-600">
                                  Size: {(bookCreationData.pdfSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!bookCreationData.pdfUrl && (
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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCloseBookCreationModal}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateBook}
                      disabled={isPdfUploading || !bookCreationData.pdfUrl}
                    >
                      Create & Publish Book
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Warning</h4>
                <p className="text-sm text-red-800">
                  Are you sure you want to permanently delete <strong>"{selectedBook?.title}"</strong>?
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This action cannot be undone. The book will be permanently removed from the system.
                </p>
                {selectedBook?.stage === 'completed' && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm text-orange-800">
                      <strong>Note:</strong> This book has been published. Deleting it will also remove:
                    </p>
                    <ul className="text-sm text-orange-700 mt-1 ml-4 list-disc">
                      <li>The published book from the main collection</li>
                      <li>All related ebook orders and subscriptions</li>
                      <li>All reviews and affiliate links</li>
                      <li>All coupons associated with this book</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Book Details:</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Author:</span> {selectedBook?.authorName}</p>
                  <p><span className="font-medium">Category:</span> {selectedBook?.category}</p>
                  <p><span className="font-medium">Stage:</span> 
                    <Badge className={`ml-2 ${getStageColor(selectedBook?.stage)}`}>
                      {getStageLabel(selectedBook?.stage)}
                    </Badge>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteBook}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}