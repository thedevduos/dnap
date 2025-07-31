"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Heart, ShoppingCart, Eye, BookOpen } from "lucide-react"
import { useFeaturedBooks } from "@/hooks/use-featured-books"
import { Link } from "react-router-dom"
import { useCart } from "@/contexts/cart-context"
import { useUser } from "@/contexts/user-context"
import anime from "animejs"

export function FeaturedBooks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [hoveredBook, setHoveredBook] = useState<number | null>(null)
  const { books: featuredBooks, loading } = useFeaturedBooks()
  const { addToCart, isInCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useUser()

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
        return "bg-primary"
    }
  }

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

  const handleWishlistToggle = async (book: any) => {
    if (isInWishlist(book.id)) {
      await removeFromWishlist(book.id)
    } else {
      await addToWishlist(book.id)
    }
  }

  return (
    <section id="books" ref={sectionRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Featured Books
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our handpicked selection of exceptional books across various genres
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading featured books...</p>
          </div>
        ) : featuredBooks.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Books Available</h3>
            <p className="text-muted-foreground">No featured books have been added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBooks.map((book) => (
            <Card
              key={book.id}
              className="book-card group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-background/80 backdrop-blur-sm"
              onMouseEnter={() => setHoveredBook(book.id)}
              onMouseLeave={() => setHoveredBook(null)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={book.imageUrl}
                  alt={book.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <Badge className={`absolute top-3 left-3 ${getBadgeColor(book.category)} text-white`}>
                  {book.category}
                </Badge>
                <div className="absolute top-3 right-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={() => handleWishlistToggle(book)}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist(book.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredBook === book.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" onClick={() => handleAddToCart(book)}>
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {isInCart(book.id) ? "In Cart" : "Buy"}
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">
                    {book.genre}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{book.title}</h3>

                <p className="text-muted-foreground mb-2">by {book.author}</p>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{book.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{book.rating}</span>
                    <span className="text-xs text-muted-foreground">(124)</span>
                  </div>
                  <span className="text-lg font-bold text-primary">{book.price}</span>
                </div>

                <div className="flex space-x-2">
                  <Button className="flex-1 group">
                    <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                    {isInCart(book.id) ? "In Cart" : "Add to Cart"}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleWishlistToggle(book)}>
                    <Heart className={`h-4 w-4 ${isInWishlist(book.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="group bg-transparent" asChild>
            <Link to="/shop">
              View All Books
              <Eye className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
export default FeaturedBooks