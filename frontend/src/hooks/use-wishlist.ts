"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useUser } from "@/contexts/user-context"

export function useWishlist() {
  const [wishlistBooks, setWishlistBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { userProfile } = useUser()

  useEffect(() => {
    const loadWishlistBooks = async () => {
      if (!userProfile?.wishlist || userProfile.wishlist.length === 0) {
        setWishlistBooks([])
        setLoading(false)
        return
      }

      try {
        const books = await Promise.all(
          userProfile.wishlist.map(async (bookId) => {
            const bookDoc = await getDoc(doc(db, "books", bookId))
            if (bookDoc.exists()) {
              return { id: bookDoc.id, ...bookDoc.data() }
            }
            return null
          })
        )

        setWishlistBooks(books.filter(book => book !== null))
      } catch (error) {
        console.error("Error loading wishlist books:", error)
      } finally {
        setLoading(false)
      }
    }

    loadWishlistBooks()
  }, [userProfile?.wishlist])

  return { wishlistBooks, loading }
}