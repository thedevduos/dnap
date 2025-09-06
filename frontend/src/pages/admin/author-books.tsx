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
import { BookOpen, Eye, IndianRupee, Check, X, LinkIcon, Trash2, Upload, Image } from "lucide-react"
import { useAllAuthorBooks } from "@/hooks/use-all-author-books"
import { updateAuthorBookStage, sendAuthorNotification, revokeAuthorAccess, deleteAuthorBook } from "@/lib/author-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadImage } from "@/lib/firebase-utils"

export default function AdminAuthorBooks() {
  const { books, loading } = useAllAuthorBooks()
  const { toast } = useToast()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentScreenshotModal, setShowPaymentScreenshotModal] = useState(false)
  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [showBookCreationModal, setShowBookCreationModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [bookCreationData, setBookCreationData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    status: "published",
    rating: "4.5",
    imageUrl: "",
    weight: "",
    edition: "",
    year: "",
    isbn: "",
    pages: "",
    format: "",
    language: "",
    publisher: "",
    royaltyPercentage: "",
  })
  const [_imageFile] = useState<File | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false)

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
      imageUrl: book.imageUrl || "",
      weight: "",
      // Pre-populate additional fields from the selected book if available
      edition: book.edition || "",
      year: book.year || "",
      isbn: book.isbn || "",
      pages: book.pages || "",
      format: book.format || "",
      language: book.language || "",
      publisher: book.publisher || "",
      royaltyPercentage: book.royaltyPercentage || "",
    })
    setShowBookCreationModal(true)
  }


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImageUploading(true)
    try {
      const imageUrl = await uploadImage(file, "book-covers")
      setBookCreationData({ ...bookCreationData, imageUrl })
      toast({
        title: "Success",
        description: "Cover image uploaded successfully!",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImageUploading(false)
    }
  }

  const handleCloseBookCreationModal = () => {
    setShowBookCreationModal(false)
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

    // Validate that cover image is uploaded
    if (!bookCreationData.imageUrl) {
      toast({
        title: "Cover Image Required",
        description: "Please upload a cover image before saving the book.",
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
        imageUrl: bookCreationData.imageUrl,
        status: bookCreationData.status,
        rating: parseFloat(bookCreationData.rating),
        weight: parseFloat(bookCreationData.weight) || 0,
        // Include all additional book details
        edition: bookCreationData.edition,
        year: bookCreationData.year,
        isbn: bookCreationData.isbn,
        pages: bookCreationData.pages,
        format: bookCreationData.format,
        language: bookCreationData.language,
        publisher: bookCreationData.publisher,
        royaltyPercentage: Math.round((parseFloat(bookCreationData.royaltyPercentage) || 0) * 100) / 100,
        createdAt: new Date(),
      }

      // Add book to books collection
      const bookRef = await addDoc(collection(db, "books"), bookData)

      // Update author book with the assigned book ID and imageUrl
      await updateAuthorBookStage(selectedBook.id, 'completed', {
        assignedBookId: bookRef.id,
        imageUrl: bookCreationData.imageUrl
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
        description += " The published book and all related data (reviews, affiliate links, etc.) have also been deleted."
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
                        {book.imageUrl ? (
                          <img
                            src={book.imageUrl}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-12 h-16 bg-muted rounded flex items-center justify-center ${book.imageUrl ? 'hidden' : 'flex'}`}
                          style={{ display: book.imageUrl ? 'none' : 'flex' }}
                        >
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
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
                                <IndianRupee className="h-3 w-3 mr-1" />
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
                    {selectedBook.imageUrl ? (
                      <img
                        src={selectedBook.imageUrl}
                        alt={selectedBook.title}
                        className="w-full h-64 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted rounded flex items-center justify-center">
                        <p className="text-muted-foreground">No image uploaded</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{selectedBook.title}</h3>
                      <p className="text-muted-foreground">by {selectedBook.authorName}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Category:</strong> {selectedBook.category}</p>
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
                  {selectedBook.pdfUrl ? (
                    <Button variant="outline" asChild>
                      <a href={selectedBook.pdfUrl} target="_blank" rel="noopener noreferrer">
                        View PDF
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      View PDF
                    </Button>
                  )}
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
                Complete the book details and upload a cover image to publish the book. The book will be automatically assigned to the author.
              </p>
            </DialogHeader>

            <div className="space-y-6">
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
                        <Label htmlFor="bookWeight">Weight (KG) *</Label>
                        <Input
                          id="bookWeight"
                          type="number"
                          step="0.01"
                          value={bookCreationData.weight}
                          onChange={(e) => setBookCreationData({...bookCreationData, weight: e.target.value})}
                          placeholder="Enter weight in KG"
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

                      {/* Additional Book Details */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Additional Book Details</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="bookEdition">Edition</Label>
                            <Input
                              id="bookEdition"
                              value={bookCreationData.edition}
                              onChange={(e) => setBookCreationData({...bookCreationData, edition: e.target.value})}
                              placeholder="e.g., 1st Edition, 2nd Edition"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bookYear">Publication Year</Label>
                            <Input
                              id="bookYear"
                              type="number"
                              value={bookCreationData.year}
                              onChange={(e) => setBookCreationData({...bookCreationData, year: e.target.value})}
                              placeholder="e.g., 2024"
                              min="1900"
                              max="2030"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label htmlFor="bookIsbn">ISBN</Label>
                            <Input
                              id="bookIsbn"
                              value={bookCreationData.isbn}
                              onChange={(e) => setBookCreationData({...bookCreationData, isbn: e.target.value})}
                              placeholder="e.g., 978-0-123456-78-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bookPages">Number of Pages *</Label>
                            <Input
                              id="bookPages"
                              type="number"
                              value={bookCreationData.pages}
                              onChange={(e) => setBookCreationData({...bookCreationData, pages: e.target.value})}
                              placeholder="e.g., 250"
                              min="1"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label htmlFor="bookFormat">Format</Label>
                            <Select
                              value={bookCreationData.format}
                              onValueChange={(value) => setBookCreationData({...bookCreationData, format: value})}
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
                            <Label htmlFor="bookLanguage">Language</Label>
                            <Select
                              value={bookCreationData.language}
                              onValueChange={(value) => setBookCreationData({...bookCreationData, language: value})}
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
                          <Label htmlFor="bookPublisher">Publisher</Label>
                          <Input
                            id="bookPublisher"
                            value={bookCreationData.publisher}
                            onChange={(e) => setBookCreationData({...bookCreationData, publisher: e.target.value})}
                            placeholder="Publisher name"
                          />
                        </div>

                        <div className="mt-4">
                          <Label htmlFor="bookRoyaltyPercentage">Royalty Percentage</Label>
                          <Input
                            id="bookRoyaltyPercentage"
                            type="number"
                            value={bookCreationData.royaltyPercentage}
                            onChange={(e) => setBookCreationData({...bookCreationData, royaltyPercentage: e.target.value})}
                            placeholder="e.g., 15"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              {/* Cover Image Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Book Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="image">Cover Image *</Label>
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
                        disabled={isImageUploading}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isImageUploading ? "Uploading..." : "Upload Cover Image"}
                      </Button>
                    </div>
                    
                    {bookCreationData.imageUrl && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Current cover:</p>
                        <div className="flex justify-center">
                          <img
                            src={bookCreationData.imageUrl}
                            alt="Cover preview"
                            className="w-32 h-40 object-cover rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseBookCreationModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBook}
                  disabled={isImageUploading || !bookCreationData.imageUrl}
                >
                  Create & Publish Book
                </Button>
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