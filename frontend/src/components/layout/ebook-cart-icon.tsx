"use client"

import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEbookCart } from "@/contexts/ebook-cart-context"
import { Link } from "react-router-dom"

export function EbookCartIcon() {
  const { getTotalItems } = useEbookCart()
  const itemCount = getTotalItems()

  if (itemCount === 0) return null

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link to="/ebook-checkout">
        <BookOpen className="h-5 w-5" />
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount}
        </Badge>
      </Link>
    </Button>
  )
}