"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Star, Heart, ShoppingCart, Eye, Search, Filter, Grid, List } from "lucide-react"
import { useBooks } from "@/hooks/use-books"
import { useCart } from "@/contexts/cart-context"
import { useUser } from "@/contexts/user-context"
import { Link } from "react-router-dom"
import anime from "animejs"

export default function ShopPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const { books, loading } = useBooks()
  const { addToCart, isInCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useUser()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedAuthor, setSelectedAuthor] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: ".book-card",
              opacity: [0, 1],
              translateY: [60, 0],
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
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || book.category === selectedCategory
      const matchesAuthor = selectedAuthor === "all" || book.author === selectedAuthor
      const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1]
      
      return matchesSearch && matchesCategory && matchesAuthor && matchesPrice
    })
    .sort((a, b) => {
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

  const handleAddToCart = (book: any) => {
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      imageUrl: book.imageUrl,
      category: book.category
    })
  }

  const handleWishlistToggle = async (bookId: string) => {
    if (isInWishlist(bookId)) {
      await removeFromWishlist(bookId)
    } else {
      await addToWishlist(bookId)
    }
  }

  return (
    <div ref={sectionRef} className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Book Store</h1>
          <p className="text-muted-foreground">Discover our complete collection of books</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search books or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle and View Mode */}
          <div className="flex justify-between items-center">
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading books...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No books found matching your criteria.</p>
              </div>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredBooks.map((book) => (
                  <Card
                    key={book.id}
                    className={`book-card group hover:shadow-lg transition-all duration-300 ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div className={`relative overflow-hidden ${
                      viewMode === "list" ? "w-32 h-40 flex-shrink-0" : "h-64"
                    }`}>
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-2 left-2 bg-primary">
                        {book.category}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={() => handleWishlistToggle(book.id)}
                      >
                        <Heart className={`h-4 w-4 ${isInWishlist(book.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>

                    <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className={viewMode === "list" ? "flex justify-between h-full" : ""}>
                        <div className={viewMode === "list" ? "flex-1" : ""}>
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            <Link to={`/book/${book.id}`}>{book.title}</Link>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                          
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
                          <div className="text-xl font-bold text-primary mb-3">
                            ₹{book.price}
                          </div>

                          <div className={`flex gap-2 ${viewMode === "list" ? "flex-col" : ""}`}>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(book)}
                              disabled={isInCart(book.id)}
                              className="flex-1"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              {isInCart(book.id) ? "In Cart" : "Add to Cart"}
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
    </div>
  )
}