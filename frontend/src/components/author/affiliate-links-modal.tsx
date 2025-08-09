"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link as LinkIcon, Copy, Plus, Eye, BarChart } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { createAffiliateLink } from "@/lib/author-utils"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AffiliateLinksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: any
}

export function AffiliateLinksModal({ open, onOpenChange, book }: AffiliateLinksModalProps) {
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (open && user && book) {
      loadAffiliateLinks()
    }
  }, [open, user, book])

  const loadAffiliateLinks = async () => {
    if (!user || !book?.assignedBookId) return
    
    setLoading(true)
    try {
      const linksQuery = query(
        collection(db, "affiliateLinks"),
        where("authorId", "==", user.uid),
        where("bookId", "==", book.assignedBookId)
      )
      const linksSnapshot = await getDocs(linksQuery)
      const links = linksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAffiliateLinks(links)
    } catch (error) {
      console.error("Error loading affiliate links:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!user || !book?.assignedBookId) return
    
    setCreating(true)
    try {
      await createAffiliateLink(user.uid, book.assignedBookId)
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
      setCreating(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Link Copied",
      description: "Affiliate link copied to clipboard!",
    })
  }

  if (!book || book.stage !== 'completed') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Affiliate Links</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Affiliate links are only available for published books.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Affiliate Links - {book.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Link */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Create Affiliate Link</CardTitle>
                <Button onClick={handleCreateLink} disabled={creating}>
                  <Plus className="h-4 w-4 mr-2" />
                  {creating ? "Creating..." : "Create New Link"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create affiliate links with embedded coupon codes to track your referral sales.
              </p>
            </CardContent>
          </Card>

          {/* Existing Links */}
          <Card>
            <CardHeader>
              <CardTitle>Your Affiliate Links</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : affiliateLinks.length === 0 ? (
                <div className="text-center py-8">
                  <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No affiliate links created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {affiliateLinks.map((link) => (
                    <Card key={link.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Code: {link.couponCode}</Badge>
                              <Badge className={link.isActive ? "bg-green-600" : "bg-gray-600"}>
                                {link.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Clicks: {link.totalClicks}</p>
                              <p>Sales: {link.totalSales}</p>
                              <p>Revenue: ₹{link.totalRevenue}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(link.url)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Stats
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs text-muted-foreground">Affiliate URL:</label>
                          <Input
                            value={link.url}
                            readOnly
                            className="text-xs font-mono"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}