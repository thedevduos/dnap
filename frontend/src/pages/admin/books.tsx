"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BookOpen, Plus, MoreHorizontal, Edit, Trash2, Star, Grid, List, User } from "lucide-react"
import { useBooks } from "@/hooks/use-books"
import { deleteBookAndAuthorData, toggleFeaturedBook, getFeaturedBooksCount } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { EnhancedBookModal } from "@/components/admin/enhanced-book-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AdminBooks() {
  const { books, loading } = useBooks()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [bookToDelete, setBookToDelete] = useState<any>(null)
  const [showAssignAuthorModal, setShowAssignAuthorModal] = useState(false)
  const [bookToAssignAuthor, setBookToAssignAuthor] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (book: any) => {
    setSelectedBook(book)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const book = books.find(b => b.id === id)
    setBookToDelete(book)
  }

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteBookAndAuthorData(bookToDelete.id)
      toast({
        title: "Success",
        description: `Book "${bookToDelete.title}" and ALL related data deleted successfully. Deleted: ${result.deletedItems.book} book, ${result.deletedItems.orders} orders, ${result.deletedItems.reviews} reviews, ${result.deletedItems.affiliateLinks} affiliate links, ${result.deletedItems.coupons} coupons, ${result.deletedItems.transactions} transactions, ${result.deletedItems.authorBooks} author books, ${result.deletedItems.wishlistUpdates} wishlist updates, and ${result.deletedItems.cartUpdates} cart updates.`,
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete book and related data",
        variant: "destructive",
      })
    } finally {
      setBookToDelete(null)
      setIsDeleting(false)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedBook(null)
  }

  const handleAssignAuthor = (book: any) => {
    setBookToAssignAuthor(book)
    setShowAssignAuthorModal(true)
  }

  const handleToggleFeatured = async (book: any) => {
    try {
      // Check if trying to feature more than 6 books
      if (!book.isFeatured) {
        const featuredCount = await getFeaturedBooksCount()
        if (featuredCount >= 6) {
          toast({
            title: "Limit Reached",
            description: "Maximum of 6 featured books allowed",
            variant: "destructive",
          })
          return
        }
      }

      await toggleFeaturedBook(book.id, !book.isFeatured)
      toast({
        title: "Success",
        description: `Book ${book.isFeatured ? 'removed from' : 'added to'} featured books`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      })
    }
  }

  const renderStars = (rating: number, size: "sm" | "md" = "md") => {
    const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`${starSize} ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
      />
    ))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Books</h1>
            <p className="text-gray-600">Add, edit, and manage book collection</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Book
            </Button>
          </div>
        </div>

        {/* Books Display */}
        <Card>
          <CardHeader>
            <CardTitle>All Books</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading books...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No books found</p>
              </div>
            ) : viewMode === "list" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cover</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Featured</TableHead>
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
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{book.category}</Badge>
                      </TableCell>
                      <TableCell>₹{book.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {renderStars(Math.floor(book.rating || 4.5))}
                          <span className="text-sm text-gray-600 ml-1">
                            ({book.rating || 4.5})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFeatured(book)}
                          className={book.isFeatured ? "text-yellow-500" : "text-gray-400"}
                        >
                          <Star className={`h-4 w-4 ${book.isFeatured ? "fill-current" : ""}`} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(book)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignAuthor(book)}>
                              <User className="h-4 w-4 mr-2" />
                              Assign Author
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(book.id)}
                              className="text-red-600"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {books.map((book) => (
                  <Card key={book.id} className="group hover:shadow-lg transition-all duration-300">
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {book.isFeatured && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-yellow-500 text-white">
                            Featured
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="mb-1">
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold mb-1 line-clamp-2 text-sm">{book.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">by {book.author}</p>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {renderStars(Math.floor(book.rating || 4.5), "sm")}
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({book.rating || 4.5})
                        </span>
                      </div>

                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-primary">₹{book.price}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFeatured(book)}
                          className={`h-6 w-6 ${book.isFeatured ? "text-yellow-500" : "text-gray-400"}`}
                        >
                          <Star className={`h-3 w-3 ${book.isFeatured ? "fill-current" : ""}`} />
                        </Button>
                      </div>

                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleEdit(book)} className="flex-1 text-xs h-8">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDelete(book.id)}
                          className="text-red-600 hover:text-red-700 h-8 w-8"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
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

      <EnhancedBookModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        book={selectedBook}
      />

      {/* Assign Author Modal */}
      <Dialog open={showAssignAuthorModal} onOpenChange={setShowAssignAuthorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Author to "{bookToAssignAuthor?.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Book Details:</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Title:</span> {bookToAssignAuthor?.title}</div>
                <div><span className="font-medium">Current Author:</span> {bookToAssignAuthor?.author || 'Not assigned'}</div>
                <div><span className="font-medium">Category:</span> {bookToAssignAuthor?.category}</div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                To assign an author to this book, please edit the book and use the "Assign Author" step in the book creation modal.
              </p>
              <Button 
                onClick={() => {
                  setShowAssignAuthorModal(false)
                  setSelectedBook(bookToAssignAuthor)
                  setIsModalOpen(true)
                }}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Book to Assign Author
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!bookToDelete} onOpenChange={() => setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book and Author Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{bookToDelete?.title}"? This will permanently delete EVERYTHING related to this book:
              <br />• The book from the collection
              <br />• All orders containing this book
              <br />• All reviews for this book
              <br />• All affiliate links and coupons
              <br />• All transactions related to this book
              <br />• Author book entry (but NOT the author account)
              <br />• Remove book from all user wishlists and carts
              <br />• All sales data for this book
              <br /><br />
              <strong>⚠️ This action cannot be undone. The author will keep their account and access to other books.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBook}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Book and All Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}