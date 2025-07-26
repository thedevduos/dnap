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
import { BookOpen, Plus, MoreHorizontal, Edit, Trash2, Star } from "lucide-react"
import { useBooks } from "@/hooks/use-books"
import { deleteBook, toggleFeaturedBook, getFeaturedBooksCount } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { BookModal } from "@/components/admin/book-modal"

export default function AdminBooks() {
  const { books, loading } = useBooks()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)

  const handleEdit = (book: any) => {
    setSelectedBook(book)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteBook(id)
      toast({
        title: "Success",
        description: "Book deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedBook(null)
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        </div>

        {/* Books Table */}
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
            ) : (
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
                            <DropdownMenuItem 
                              onClick={() => handleDelete(book.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
      </div>

      <BookModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        book={selectedBook}
      />
    </AdminLayout>
  )
}