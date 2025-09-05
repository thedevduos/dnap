"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Heart, ShoppingCart, Search, BookOpen, Filter, Grid, List, Star, Eye } from "lucide-react"
import { useBooks } from "@/hooks/use-books"
import { useCart } from "@/contexts/cart-context"
import { useUser } from "@/contexts/user-context"
import { useAuth } from "@/contexts/auth-context"
import { Link } from "react-router-dom"
import { LoginPopup } from "@/components/ui/login-popup"
import anime from "animejs"

export default function BooksPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const [hoveredBook, setHoveredBook] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedAuthor, setSelectedAuthor] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const { books, loading } = useBooks()
  const { isAdmin, addToWishlist, removeFromWishlist, isInWishlist } = useUser()
  const { user } = useAuth()
  const { addToCart, isInCart } = useCart()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: ".book-card",
              opacity: [0, 1],
              translateY: [60, 0],
              rotateY: [15, 0],
              delay: anime.stagger(100),
              duration: 800,
              easing: "easeOutQuart",
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Get unique categories and authors
  const categories = [...new Set(books.map(book => book.category).filter(Boolean))]
  const authors = [...new Set(books.map(book => book.author).filter(Boolean))]

  // Filter and sort books
  const filteredBooks = books
    .filter((book: any) => {
      const matchesSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.category?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || book.category === selectedCategory
      const matchesAuthor = selectedAuthor === "all" || book.author === selectedAuthor
      const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1]
      
      return matchesSearch && matchesCategory && matchesAuthor && matchesPrice
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "title":
          return a.title.localeCompare(b.title)
        case "newest":
        default:
          return new Date(b.createdAt?.toDate() || 0).getTime() - new Date(a.createdAt?.toDate() || 0).getTime()
      }
    })

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "New Release":
        return "bg-green-500"
      case "Bestseller":
        return "bg-yellow-500"
      case "Award Winner":
        return "bg-purple-500"
      case "Popular":
        return "bg-blue-500"
      case "Trending":
        return "bg-red-500"
      case "Educational":
        return "bg-indigo-500"
      default:
        return "bg-orange-500"
    }
  }

  const handleWishlistToggle = async (bookId: string) => {
    if (!user) {
      setShowLoginPopup(true)
      return
    }

    try {
      if (isInWishlist(bookId)) {
        await removeFromWishlist(bookId)
      } else {
        await addToWishlist(bookId)
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  const handleAddToCart = (book: any) => {
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      imageUrl: book.imageUrl,
      category: book.category,
      quantity: 1
    })
  }

  return (
    <section ref={sectionRef} className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Our Book Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover our extensive collection of books across various categories
          </p>

          {/* Admin restriction notice */}
          {isAdmin && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
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

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search books, authors, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle and View Mode */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {filteredBooks.length} books found
              </span>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>

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
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`w-64 space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Filters</h3>
                
                {/* Category Filter */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Author Filter */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Author</label>
                  <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Authors</SelectItem>
                      {authors.map(author => (
                        <SelectItem key={author} value={author}>{author}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    min={0}
                    step={10}
                    className="mt-2"
                  />
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedAuthor("all")
                    setPriceRange([0, 1000])
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Books Grid/List */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading books...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Books Available</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== "all" || selectedAuthor !== "all" || priceRange[0] !== 0 || priceRange[1] !== 1000 
                    ? "No books match your search criteria." 
                    : "No books have been added yet."}
                </p>
              </div>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
                : "space-y-4"
              }>
                {filteredBooks.map((book: any, index: number) => (
                  <Card
                    key={book.id}
                    className={`book-card group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-background/80 backdrop-blur-sm ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                    onMouseEnter={() => setHoveredBook(index)}
                    onMouseLeave={() => setHoveredBook(null)}
                  >
                    <div className={`relative overflow-hidden ${
                      viewMode === "list" ? "w-32 h-40 flex-shrink-0" : "h-64"
                    }`}>
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                          viewMode === "list" ? "group-hover:scale-105" : ""
                        }`}
                      />
                      {book.category && (
                        <Badge className={`absolute top-3 left-3 ${getBadgeColor(book.category)} text-white`}>
                          {book.category}
                        </Badge>
                      )}
                      <div className="absolute top-3 right-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                            isInWishlist(book.id) ? "text-red-500" : ""
                          }`}
                          onClick={() => handleWishlistToggle(book.id)}
                        >
                          <Heart className={`h-4 w-4 ${isInWishlist(book.id) ? "fill-current" : ""}`} />
                        </Button>
                      </div>

                      {/* Hover overlay */}
                      <div
                        className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
                          hoveredBook === index ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <Button size="sm" asChild disabled={isAdmin}>
                          <Link to={isAdmin ? "#" : `/book/${book.id}`}>
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {isAdmin ? "Admin Cannot Purchase" : "Buy Now"}
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <CardContent className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className={viewMode === "list" ? "flex justify-between h-full" : ""}>
                        <div className={viewMode === "list" ? "flex-1" : ""}>
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              {book.category}
                            </Badge>
                          </div>

                          <h3 className="text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors">
                            <Link to={`/book/${book.id}`} className="hover:text-orange-600">
                              {book.title}
                            </Link>
                          </h3>

                          <p className="text-muted-foreground mb-2">by {book.author}</p>

                          {viewMode === "list" && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {book.description}
                            </p>
                          )}

                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(book.rating || 4.5)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({book.rating || 4.5})
                            </span>
                          </div>
                        </div>

                        <div className={viewMode === "list" ? "flex flex-col justify-between items-end" : ""}>
                          <div className="text-xl font-bold text-orange-600 mb-3">
                            ₹{book.price}
                          </div>

                          <div className={`flex gap-2 ${viewMode === "list" ? "flex-col" : ""}`}>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(book)}
                              disabled={isInCart(book.id) || isAdmin}
                              className="flex-1"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              {isInCart(book.id) ? "In Cart" : isAdmin ? "Admin Cannot Purchase" : "Add to Cart"}
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/book/${book.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginPopup
        open={showLoginPopup}
        onOpenChange={setShowLoginPopup}
        action="add items to your wishlist"
      />
    </section>
  )
}