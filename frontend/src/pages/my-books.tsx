"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Eye, Lock, Star } from "lucide-react"
import { useUserEbookAccess } from "@/hooks/use-user-ebook-access"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PDFViewer } from "@/components/ebook/pdf-viewer"
import { checkUserBookAccess } from "@/lib/ebook-utils"
import { Link } from "react-router-dom"

export default function MyBooksPage() {
  const { accessibleBooks, loading } = useUserEbookAccess()
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [verifyingAccess, setVerifyingAccess] = useState<string | null>(null)

  const handleReadBook = async (book: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to read books",
        variant: "destructive",
      })
      return
    }

    if (!book.pdfUrl) {
      toast({
        title: "PDF Not Available",
        description: "This book doesn't have a PDF version available",
        variant: "destructive",
      })
      return
    }

    setVerifyingAccess(book.id)
    
    try {
      // Verify user still has access to this book
      const hasAccess = await checkUserBookAccess(user.uid, book.id)
      
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "Your subscription has expired or you don't have access to this book",
          variant: "destructive",
        })
        return
      }

      setSelectedBook(book)
      setPdfViewerOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify book access. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVerifyingAccess(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Login Required</h1>
            <p className="text-muted-foreground mb-8">
              Please login to access your e-books
            </p>
            <Button asChild size="lg">
              <Link to="/auth/login">
                Login to Continue
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (accessibleBooks.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">No Books Available</h1>
            <p className="text-muted-foreground mb-8">
              You don't have access to any e-books. Subscribe to a plan to start reading!
            </p>
            <div className="space-y-4">
              <Button asChild size="lg">
                <Link to="/pricing">
                  View E-book Plans
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ebooks">
                  View My Subscriptions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Books</h1>
          <p className="text-muted-foreground">
            Your accessible e-book library ({accessibleBooks.length} books)
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {accessibleBooks.map((book) => (
            <Card key={book.id} className="group hover:shadow-lg transition-all duration-300">
              <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                <img
                  src={book.imageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-600 text-white text-xs">
                    E-book
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">
                    {book.category}
                  </Badge>
                </div>
                
                <h3 className="font-semibold mb-1 line-clamp-2 text-sm">{book.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">by {book.author}</p>
                
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < Math.floor(book.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({book.rating})
                  </span>
                </div>

                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleReadBook(book)}
                  disabled={verifyingAccess === book.id}
                >
                  {verifyingAccess === book.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Read
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedBook && (
          <PDFViewer
            open={pdfViewerOpen}
            onOpenChange={setPdfViewerOpen}
            pdfUrl={selectedBook.pdfUrl}
            bookTitle={selectedBook.title}
          />
        )}
      </div>
    </div>
  )
}