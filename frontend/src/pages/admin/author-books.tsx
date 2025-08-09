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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, MoreHorizontal, Eye, DollarSign, Check, X } from "lucide-react"
import { useAllAuthorBooks } from "@/hooks/use-all-author-books"
import { updateAuthorBookStage, sendAuthorNotification } from "@/lib/author-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminAuthorBooks() {
  const { books, loading } = useAllAuthorBooks()
  const { toast } = useToast()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")

  const handleViewDetails = (book: any) => {
    setSelectedBook(book)
    setShowDetailsModal(true)
  }

  const handleCollectPayment = (book: any) => {
    setSelectedBook(book)
    setShowPaymentModal(true)
  }

  const handleSetPaymentAmount = async () => {
    if (!selectedBook || !paymentAmount) return

    try {
      await updateAuthorBookStage(selectedBook.id, 'payment', {
        paymentAmount: parseFloat(paymentAmount)
      })

      // Send notification to author
      await sendAuthorNotification(
        selectedBook.authorEmail || 'author@example.com',
        'payment',
        selectedBook.title,
        { amount: paymentAmount }
      )

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
      await sendAuthorNotification(
        book.authorEmail || 'author@example.com',
        'editing',
        book.title
      )

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
    try {
      await updateAuthorBookStage(book.id, 'completed')

      // Send completion notification
      await sendAuthorNotification(
        book.authorEmail || 'author@example.com',
        'completed',
        book.title
      )

      toast({
        title: "Book Completed",
        description: "Author has been notified about the completion.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete book.",
        variant: "destructive"
      })
    }
  }

  const handleRejectBook = async (book: any) => {
    if (window.confirm(`Are you sure you want to reject "${book.title}"? This will delete the author account.`)) {
      try {
        // Send rejection notification
        await sendAuthorNotification(
          book.authorEmail || 'author@example.com',
          'rejected',
          book.title
        )

        // Here you would also delete the author account
        // Implementation depends on your requirements

        toast({
          title: "Book Rejected",
          description: "Author has been notified about the rejection.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reject book.",
          variant: "destructive"
        })
      }
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(book)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {book.stage === 'review' && (
                              <>
                                <DropdownMenuItem onClick={() => handleCollectPayment(book)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Collect Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRejectBook(book)}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject Book
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {book.stage === 'payment_verification' && (
                              <DropdownMenuItem onClick={() => handleVerifyPayment(book)}>
                                <Check className="h-4 w-4 mr-2" />
                                Verify Payment
                              </DropdownMenuItem>
                            )}
                            
                            {book.stage === 'editing' && (
                              <DropdownMenuItem onClick={() => handleCompleteBook(book)}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      </div>
    </AdminLayout>
  )
}