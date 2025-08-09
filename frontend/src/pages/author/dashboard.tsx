"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Link as LinkIcon, Plus, Eye, BarChart } from "lucide-react"
import { useAuthorBooks } from "@/hooks/use-author-books"
import { useAuth } from "@/contexts/auth-context"
import { AuthorLayout } from "@/components/author/author-layout"
import { NewBookModal } from "@/components/author/new-book-modal"
import { SalesReportModal } from "@/components/author/sales-report-modal"
import { AffiliateLinksModal } from "@/components/author/affiliate-links-modal"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AuthorDashboard() {
  const { books, loading } = useAuthorBooks()
  const { user } = useAuth()
  const [showNewBookModal, setShowNewBookModal] = useState(false)
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [authorStatus, setAuthorStatus] = useState<string>('pending')
  const [paymentRequired, setPaymentRequired] = useState<any>(null)

  useEffect(() => {
    if (user) {
      checkAuthorStatus()
      checkPaymentStatus()
    }
  }, [user, books])

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

              <div className="space-y-4">
                <h4 className="font-semibold">Payment Methods:</h4>
                <div className="space-y-2 text-sm">
                  <p>• Bank Transfer: [Bank details will be provided]</p>
                  <p>• UPI: [UPI ID will be provided]</p>
                  <p>• Online Payment: [Payment link will be provided]</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    After making the payment, please upload the screenshot below for verification.
                  </p>
                </div>

                <div>
                  <Label>Payment Screenshot</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>

                <Button className="w-full">
                  Submit Payment Screenshot
                </Button>
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
                  <p className="text-2xl font-bold text-purple-600">0</p>
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
                  <p className="text-2xl font-bold text-orange-600">₹0</p>
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
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
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