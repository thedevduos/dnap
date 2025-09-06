"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Link as LinkIcon, Plus, Eye, BarChart, Upload } from "lucide-react"
import { useAuthorBooks } from "@/hooks/use-author-books"
import { useAuth } from "@/contexts/auth-context"
import { AuthorLayout } from "@/components/author/author-layout"
import { NewBookModal } from "@/components/author/new-book-modal"
import { SalesReportModal } from "@/components/author/sales-report-modal"
import { AffiliateLinksModal } from "@/components/author/affiliate-links-modal"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Label } from "@/components/ui/label"
import { uploadAuthorFile, updateAuthorBookStage, sendAuthorNotification, getAuthorSalesReport } from "@/lib/author-utils"
import { useToast } from "@/hooks/use-toast"

export default function AuthorDashboard() {
  const { books, loading } = useAuthorBooks()
  const { user } = useAuth()
  const [showNewBookModal, setShowNewBookModal] = useState(false)
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [authorStatus, setAuthorStatus] = useState<string>('pending')
  const [paymentRequired, setPaymentRequired] = useState<any>(null)
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [affiliateLinksCount, setAffiliateLinksCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const { toast } = useToast()

  const checkAuthorStatus = async () => {
    if (!user) return
    
    try {
      const authorsQuery = query(collection(db, "authors"), where("uid", "==", user.uid))
      const authorsSnapshot = await getDocs(authorsQuery)
      
      if (!authorsSnapshot.empty) {
        const author = authorsSnapshot.docs[0].data()
        setAuthorStatus(author.status || 'pending')
      }
    } catch (error) {
      console.error("Error checking author status:", error)
    }
  }

  const checkPaymentStatus = () => {
    const paymentRequiredBook = books.find(book => book.stage === 'payment')
    setPaymentRequired(paymentRequiredBook || null)
  }

  const loadAffiliateLinksCount = async () => {
    if (!user) return
    
    try {
      const affiliateLinksQuery = query(
        collection(db, "affiliateLinks"),
        where("authorId", "==", user.uid)
      )
      const affiliateLinksSnapshot = await getDocs(affiliateLinksQuery)
      setAffiliateLinksCount(affiliateLinksSnapshot.docs.length)
    } catch (error) {
      console.error("Error loading affiliate links count:", error)
    }
  }

  const loadTotalRevenue = async () => {
    if (!user) return
    
    try {
      const salesData = await getAuthorSalesReport(user.uid)
      const total = salesData.reduce((sum, item) => sum + (item.royaltyAmount || 0), 0)
      setTotalRevenue(total)
    } catch (error) {
      console.error("Error loading total revenue:", error)
    }
  }

  useEffect(() => {
    if (user) {
      checkAuthorStatus()
      checkPaymentStatus()
      loadAffiliateLinksCount()
      loadTotalRevenue()
    }
  }, [user, books])

  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPaymentScreenshotFile(file)
  }

  const handleSubmitPayment = async () => {
    if (!paymentScreenshotFile || !paymentRequired) return
    
    setSubmittingPayment(true)
    try {
      // Upload payment screenshot
      const screenshotUrl = await uploadAuthorFile(paymentScreenshotFile, 'payments', user!.uid)
      
      // Update book stage to payment_verification
      await updateAuthorBookStage(paymentRequired.id, 'payment_verification', {
        paymentScreenshot: screenshotUrl,
        paymentStatus: 'submitted'
      })

      // Send notification to admin
      if (paymentRequired.authorEmail) {
        await sendAuthorNotification(
          paymentRequired.authorEmail,
          'payment_verification',
          paymentRequired.title
        )
      }

      toast({
        title: "Payment Submitted",
        description: "Your payment screenshot has been submitted for verification.",
      })

      // Reset form
      setPaymentScreenshotFile(null)
      setPaymentRequired(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmittingPayment(false)
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

  // Show payment required page if author has books requiring payment
  if (paymentRequired) {
    return (
      <AuthorLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-orange-600">Payment Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  "{paymentRequired.title}" - Approved for Publication
                </h3>
                <p className="text-muted-foreground mb-4">
                  Congratulations! Your book has been approved. Please complete the payment to proceed with publication.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-lg font-semibold text-orange-800">
                    Amount Due: ₹{paymentRequired.paymentAmount || 'TBD'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Payment Methods</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>UPI:</strong> dnapublications@okicici</p>
                  <p><strong>Bank Transfer:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>Account Name: DNA Publications</li>
                    <li>Account Number: 1234567890</li>
                    <li>IFSC Code: ICIC0001234</li>
                    <li>Bank: ICICI Bank</li>
                  </ul>
                  <p><strong>Paytm:</strong> 7598691689</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentScreenshot">Upload Payment Screenshot *</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="paymentScreenshot"
                      accept="image/*,.pdf"
                      onChange={handlePaymentFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("paymentScreenshot")?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {paymentScreenshotFile ? paymentScreenshotFile.name : "Upload Payment Screenshot"}
                    </Button>
                    {paymentScreenshotFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {paymentScreenshotFile.name} selected
                      </p>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitPayment}
                  disabled={!paymentScreenshotFile || submittingPayment}
                  className="w-full"
                >
                  {submittingPayment ? "Submitting..." : "Submit Payment for Verification"}
                </Button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Please include the transaction ID/reference number in your payment</li>
                  <li>• Upload a clear screenshot or PDF of the payment confirmation</li>
                  <li>• Payment verification typically takes 1-2 business days</li>
                  <li>• You'll receive an email notification once payment is verified</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthorLayout>
    )
  }

  // Show payment verification status page
  const paymentVerificationBook = books.find(book => book.stage === 'payment_verification')
  if (paymentVerificationBook) {
    return (
      <AuthorLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-600">Payment Under Verification</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="animate-pulse">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">"{paymentVerificationBook.title}" - Payment Submitted</h3>
                <p className="text-muted-foreground">
                  We have received your payment screenshot and are currently verifying it. 
                  This process typically takes 1-2 business days.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You'll receive an email notification once the payment verification is complete.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthorLayout>
    )
  }

  // Show review status page if author is under review
  if (authorStatus === 'pending' && books.some(book => book.stage === 'review')) {
    return (
      <AuthorLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-600">Book Under Review</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="animate-pulse">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Your submission is being reviewed</h3>
                <p className="text-muted-foreground">
                  Our editorial team is currently reviewing your book submission. 
                  This process typically takes 3-5 business days.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You'll receive an email notification once the review is complete.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthorLayout>
    )
  }

  return (
    <AuthorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Author Dashboard</h1>
            <p className="text-gray-600">Manage your books and track your success</p>
          </div>
          <Button onClick={() => setShowNewBookModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Publish Another Book
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Books</p>
                  <p className="text-2xl font-bold">{books.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">
                    {books.filter(book => book.stage === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <LinkIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Affiliate Links</p>
                  <p className="text-2xl font-bold text-purple-600">{affiliateLinksCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Books List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Books</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSalesModal(true)}>
                  <BarChart className="h-4 w-4 mr-2" />
                  Sales Report
                </Button>
                <Button variant="outline" onClick={() => setShowAffiliateModal(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Affiliate Links
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading your books...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No books submitted yet</p>
                <Button onClick={() => setShowNewBookModal(true)}>
                  Submit Your First Book
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="group hover:shadow-lg transition-all duration-300">
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                      {book.imageUrl ? (
                        <img
                          src={book.imageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center bg-muted ${book.imageUrl ? 'hidden' : 'flex'}`}
                        style={{ display: book.imageUrl ? 'none' : 'flex' }}
                      >
                        <div className="text-center p-4">
                          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No image uploaded</p>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className={getStageColor(book.stage)}>
                          {getStageLabel(book.stage)}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{book.category}</p>
                      <p className="text-xs text-muted-foreground mb-3">{book.pages} pages • {book.language}</p>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedBook(book)
                            setShowSalesModal(true)
                          }}
                          disabled={book.stage !== 'completed'}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Sales
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedBook(book)
                            setShowAffiliateModal(true)
                          }}
                          disabled={book.stage !== 'completed'}
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Links
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <NewBookModal
        open={showNewBookModal}
        onOpenChange={setShowNewBookModal}
      />

      <SalesReportModal
        open={showSalesModal}
        onOpenChange={setShowSalesModal}
        book={selectedBook}
      />

      <AffiliateLinksModal
        open={showAffiliateModal}
        onOpenChange={setShowAffiliateModal}
        book={selectedBook}
      />
    </AuthorLayout>
  )
}