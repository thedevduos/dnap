"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Star, Heart, ShoppingCart, ArrowLeft, Share2, Truck, Shield, RotateCcw } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useCart } from "@/contexts/cart-context"
import { useUser } from "@/contexts/user-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { addReview } from "@/lib/firebase-utils"
import { LoginPopup } from "@/components/ui/login-popup"

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: any
  helpful: number
}

interface Book {
  id: string
  title: string
  author: string
  description: string
  price: number
  imageUrl: string
  category?: string
  rating?: number
  status?: string
  createdAt?: any
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  
  const { addToCart, isInCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist, isAdmin } = useUser()
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      loadBookDetails()
      loadReviews()
    }
  }, [id])

  const loadBookDetails = async () => {
    try {
      const bookDoc = await getDoc(doc(db, "books", id!))
      if (bookDoc.exists()) {
        const bookData = { id: bookDoc.id, ...bookDoc.data() } as Book
        setBook(bookData)
        
        // Load related books (same category)
        if (bookData.category) {
          const relatedQuery = query(
            collection(db, "books"),
            where("category", "==", bookData.category),
            orderBy("createdAt", "desc")
          )
          const relatedSnapshot = await getDocs(relatedQuery)
          const related = relatedSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Book))
            .filter(b => b.id !== id)
            .slice(0, 4)
          setRelatedBooks(related)
        }
      }
    } catch (error) {
      console.error("Error loading book:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("bookId", "==", id),
        where("status", "==", "approved"), // Only show approved reviews to customers
        orderBy("createdAt", "desc")
      )
      const reviewsSnapshot = await getDocs(reviewsQuery)
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[]
      setReviews(reviewsData)
    } catch (error) {
      console.error("Error loading reviews:", error)
    }
  }

  const handleAddToCart = () => {
    if (book) {
      addToCart({
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        imageUrl: book.imageUrl,
        category: book.category || ''
      })
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      setShowLoginPopup(true)
      return
    }

    if (!book) return
    
    if (isInWishlist(book.id)) {
      await removeFromWishlist(book.id)
    } else {
      await addToWishlist(book.id)
    }
  }

  const handleShare = async () => {
    if (!book) return

    const shareData = {
      title: book.title,
      text: `Check out "${book.title}" by ${book.author} on DNA Publications`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        // Use native Web Share API if available
        await navigator.share(shareData)
        toast({
          title: "Shared!",
          description: "Book shared successfully",
        })
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied!",
          description: "Book link has been copied to your clipboard",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied!",
          description: "Book link has been copied to your clipboard",
        })
      } catch (clipboardError) {
        toast({
          title: "Error",
          description: "Failed to share book",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmitReview = async () => {
    if (!user || !book) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
        variant: "destructive"
      })
      return
    }

    if (!newReview.comment.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review comment",
        variant: "destructive"
      })
      return
    }

    setSubmittingReview(true)
    try {
      await addReview({
        bookId: book.id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        rating: newReview.rating,
        comment: newReview.comment,
        status: 'pending'
      })

      toast({
        title: "Review Submitted",
        description: "Thank you for your review! It will be reviewed by our team."
      })

      setNewReview({ rating: 5, comment: "" })
      loadReviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : book?.rating || 4.5

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
          <Link to="/books">
            <Button>Back to Books</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/books" className="inline-flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Link>
        </div>

        {/* Admin restriction notice */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Admin Access Restricted
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Admin users are not allowed to make purchases. Please use a customer account to add items to cart.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Book Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Book Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] relative overflow-hidden rounded-lg">
              <img
                src={book.imageUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Book Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{book.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>

              <div className="text-3xl font-bold text-primary mb-6">
                ₹{book.price}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isInCart(book.id) || isAdmin}
                  className="flex-1"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isInCart(book.id) ? "In Cart" : isAdmin ? "Admin Cannot Purchase" : "Add to Cart"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(book.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over ₹1000</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">100% secure</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {/* Write Review */}
              {user ? (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setNewReview({ ...newReview, rating })}
                              className="p-1"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  rating <= newReview.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Review</label>
                        <Textarea
                          placeholder="Share your thoughts about this book..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleSubmitReview} disabled={submittingReview}>
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                    <p className="text-muted-foreground mb-4">
                      Please login to write a review for this book.
                    </p>
                    <Button asChild>
                      <Link to="/auth/login" state={{ from: { pathname: `/book/${id}` } }}>
                        Login to Review
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">{review.userName}</h4>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.createdAt?.toDate?.()?.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}

                {reviews.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No reviews yet. Be the first to review this book!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Book Details</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Author:</dt>
                        <dd>{book.author}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Category:</dt>
                        <dd>{book.category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Price:</dt>
                        <dd>₹{book.price}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Status:</dt>
                        <dd className="capitalize">{book.status}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Books</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <Card key={relatedBook.id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                    <img
                      src={relatedBook.imageUrl}
                      alt={relatedBook.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-2">
                      <Link to={`/book/${relatedBook.id}`} className="hover:text-primary">
                        {relatedBook.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">by {relatedBook.author}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">₹{relatedBook.price}</span>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/book/${relatedBook.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <LoginPopup
        open={showLoginPopup}
        onOpenChange={setShowLoginPopup}
        action="add this book to your wishlist"
      />
    </div>
  )
}