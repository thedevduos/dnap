"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Link as LinkIcon, 
  Copy, 
  Eye, 
  TrendingUp,
  Search
} from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { collection, query, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminAffiliateLinks() {
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLink, setSelectedLink] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAuthor, setFilterAuthor] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load affiliate links
      const linksQuery = query(collection(db, "affiliateLinks"))
      const linksSnapshot = await getDocs(linksQuery)
      const linksData = linksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAffiliateLinks(linksData)

      // Load authors
      const authorsQuery = query(collection(db, "authors"))
      const authorsSnapshot = await getDocs(authorsQuery)
      const authorsData = authorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAuthors(authorsData)

      // Load books
      const booksQuery = query(collection(db, "books"))
      const booksSnapshot = await getDocs(booksQuery)
      const booksData = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setBooks(booksData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load affiliate links data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "affiliateLinks", linkId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      })
      
      toast({
        title: "Success",
        description: `Affiliate link ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      })
      
      loadData() // Reload data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update link status.",
        variant: "destructive"
      })
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Link Copied",
      description: "Affiliate link copied to clipboard!",
    })
  }

  const handleViewDetails = (link: any) => {
    setSelectedLink(link)
    setShowDetailsModal(true)
  }

  const getAuthorName = (authorId: string) => {
    const author = authors.find(a => a.uid === authorId)
    return author?.name || "Unknown Author"
  }

  const getBookTitle = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    return book?.title || "Unknown Book"
  }

  const getAuthorEmail = (authorId: string) => {
    const author = authors.find(a => a.uid === authorId)
    return author?.email || "Unknown"
  }

  // Filter affiliate links
  const filteredLinks = affiliateLinks.filter(link => {
    const authorName = getAuthorName(link.authorId).toLowerCase()
    const bookTitle = getBookTitle(link.bookId).toLowerCase()
    const searchMatch = searchTerm === "" || 
      authorName.includes(searchTerm.toLowerCase()) ||
      bookTitle.includes(searchTerm.toLowerCase()) ||
      link.couponCode.toLowerCase().includes(searchTerm.toLowerCase())
    
    const authorMatch = filterAuthor === "all" || link.authorId === filterAuthor
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "active" && link.isActive) ||
      (filterStatus === "inactive" && !link.isActive)
    
    return searchMatch && authorMatch && statusMatch
  })

  const totalClicks = filteredLinks.reduce((sum, link) => sum + link.totalClicks, 0)
  const totalSales = filteredLinks.reduce((sum, link) => sum + link.totalSales, 0)
  const totalRevenue = filteredLinks.reduce((sum, link) => sum + link.totalRevenue, 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Links Management</h1>
          <p className="text-gray-600">Manage and monitor all author affiliate links</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <LinkIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Links</p>
                  <p className="text-2xl font-bold">{filteredLinks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold">{totalClicks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold">{totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <LinkIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by author, book, or coupon code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Select value={filterAuthor} onValueChange={setFilterAuthor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by author" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authors</SelectItem>
                    {authors.map(author => (
                      <SelectItem key={author.uid} value={author.uid}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Affiliate Links ({filteredLinks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading affiliate links...</p>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-8">
                <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No affiliate links found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Coupon Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getAuthorName(link.authorId)}</div>
                          <div className="text-sm text-muted-foreground">{getAuthorEmail(link.authorId)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{getBookTitle(link.bookId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{link.couponCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={link.isActive ? "bg-green-600" : "bg-gray-600"}>
                          {link.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{link.totalClicks}</TableCell>
                      <TableCell>{link.totalSales}</TableCell>
                      <TableCell>₹{link.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell>
                        {link.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(link)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
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
                            variant={link.isActive ? "destructive" : "default"}
                            onClick={() => handleToggleLinkStatus(link.id, link.isActive)}
                          >
                            {link.isActive ? "Deactivate" : "Activate"}
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
      </div>

      {/* Link Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Affiliate Link Details</DialogTitle>
          </DialogHeader>
          {selectedLink && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Author Information</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Name:</span> {getAuthorName(selectedLink.authorId)}</div>
                    <div><span className="font-medium">Email:</span> {getAuthorEmail(selectedLink.authorId)}</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Book Information</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Title:</span> {getBookTitle(selectedLink.bookId)}</div>
                    <div><span className="font-medium">Coupon Code:</span> {selectedLink.couponCode}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Clicks:</span> {selectedLink.totalClicks}
                  </div>
                  <div>
                    <span className="font-medium">Total Sales:</span> {selectedLink.totalSales}
                  </div>
                  <div>
                    <span className="font-medium">Total Revenue:</span> ₹{selectedLink.totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Affiliate Link URL</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm break-all">{selectedLink.url}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                <Button onClick={() => handleCopyLink(selectedLink.url)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
} 