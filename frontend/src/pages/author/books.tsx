"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Eye, Link as LinkIcon } from "lucide-react"
import { useAuthorBooks } from "@/hooks/use-author-books"

import { AuthorLayout } from "@/components/author/author-layout"
import { SalesReportModal } from "@/components/author/sales-report-modal"
import { AffiliateLinksModal } from "@/components/author/affiliate-links-modal"

export default function AuthorBooksPage() {
  const { books, loading } = useAuthorBooks()

  const [showSalesModal, setShowSalesModal] = useState(false)
  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)

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
    <AuthorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
          <p className="text-gray-600">Manage and track your published books</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Books ({books.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading your books...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No books found</p>
                <p className="text-sm text-gray-500 mt-2">Start by submitting your first book</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="overflow-hidden">
                    <div className="aspect-[3/4] relative">
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
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