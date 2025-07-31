"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Search, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useBooks } from "@/hooks/use-books"
import { useUser } from "@/contexts/user-context"
import { Link } from "react-router-dom"
import anime from "animejs"

export default function BooksPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const [hoveredBook, setHoveredBook] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { books, loading } = useBooks()
  const { isAdmin } = useUser()

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

  const filteredBooks = books.filter(
    (book: any) =>
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  return (
    <section ref={sectionRef} className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Our Book Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover our extensive collection of books across various genres
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
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search books, authors, or genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
              {searchTerm ? "No books match your search criteria." : "No books have been added yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooks.map((book: any, index: number) => (
              <Card
                key={book.id}
                className="book-card group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-background/80 backdrop-blur-sm"
                onMouseEnter={() => setHoveredBook(index)}
                onMouseLeave={() => setHoveredBook(null)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <Heart className="h-4 w-4" />
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

                <CardContent className="p-6">
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

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{book.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      {/* <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">4.8</span>
                      <span className="text-xs text-muted-foreground">(124)</span> */}
                    </div>
                    <span className="text-lg font-bold text-orange-600">₹{book.price}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button className="flex-1 group bg-orange-600 hover:bg-orange-700" disabled={isAdmin}>
                      <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                      <Link to={isAdmin ? "#" : `/book/${book.id}`}>
                        {isAdmin ? "Admin Cannot Purchase" : "Add to Cart"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}