"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link as LinkIcon, Copy, ExternalLink, Plus } from "lucide-react"
import { useAuthorBooks } from "@/hooks/use-author-books"
import { useAuth } from "@/contexts/auth-context"
import { AuthorLayout } from "@/components/author/author-layout"
import { createAffiliateLink } from "@/lib/author-utils"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AuthorAffiliatePage() {
  const { books } = useAuthorBooks()
  const { user } = useAuth()
  const { toast } = useToast()
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([])

  const [creatingLink, setCreatingLink] = useState<string | null>(null)

  const completedBooks = books.filter(book => book.stage === 'completed')

  useEffect(() => {
    if (user && completedBooks.length > 0) {
      loadAffiliateLinks()
    }
  }, [user, completedBooks])

  const loadAffiliateLinks = async () => {
    if (!user) return
    
    try {
      const linksQuery = query(
        collection(db, "affiliateLinks"),
        where("authorId", "==", user.uid)
      )
      const linksSnapshot = await getDocs(linksQuery)
      const links = linksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAffiliateLinks(links)
    } catch (error) {
      console.error("Error loading affiliate links:", error)
    }
  }

  const handleCreateLink = async (bookId: string) => {
    if (!user) return
    
    setCreatingLink(bookId)
    try {
      await createAffiliateLink(user.uid, bookId)
      toast({
        title: "Affiliate Link Created",
        description: "Your affiliate link has been created successfully!",
      })
      loadAffiliateLinks()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create affiliate link. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCreatingLink(null)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Link Copied",
      description: "Affiliate link copied to clipboard!",
    })
  }



  return (
    <AuthorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Links</h1>
          <p className="text-gray-600">Create and manage affiliate links for your books</p>
        </div>

        {completedBooks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No published books found</p>
              <p className="text-sm text-gray-500 mt-2">Affiliate links can be created once your books are published</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-2">How Affiliate Links Work</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Create unique affiliate links for each of your published books</li>
                  <li>• Each link includes a tracking coupon code (no discount applied)</li>
                  <li>• Track clicks, sales, and revenue from your affiliate links</li>
                  <li>• Monitor sales performance through your affiliate links</li>
                </ul>
              </CardContent>
            </Card>

            {/* Books with Affiliate Links */}
            <div className="space-y-6">
              {completedBooks.map((book) => {
                const bookLinks = affiliateLinks.filter(link => 
                  link.bookId === book.assignedBookId || link.bookId === book.id
                )
                
                return (
                  <Card key={book.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={book.imageUrl}
                            alt={book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div>
                            <CardTitle className="text-lg">{book.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{book.category}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCreateLink(book.assignedBookId || book.id)}
                          disabled={creatingLink === (book.assignedBookId || book.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {creatingLink === (book.assignedBookId || book.id) ? "Creating..." : "Create Link"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {bookLinks.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No affiliate links created yet
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookLinks.map((link) => (
                            <div key={link.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">Code: {link.couponCode}</Badge>
                                  <Badge className={link.isActive ? "bg-green-600" : "bg-gray-600"}>
                                    {link.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyLink(link.url)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                  >
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Visit
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Clicks:</span> {link.totalClicks}
                                </div>
                                <div>
                                  <span className="font-medium">Sales:</span> {link.totalSales}
                                </div>
                                <div>
                                  <span className="font-medium">Revenue:</span> ₹{link.totalRevenue}
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <p className="text-xs text-muted-foreground break-all">
                                  {link.url}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AuthorLayout>
  )
} 