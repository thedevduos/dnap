"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { BookWithEbook } from "@/types/ebook"

export function useUserEbookAccess() {
  const [accessibleBooks, setAccessibleBooks] = useState<BookWithEbook[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setAccessibleBooks([])
      setLoading(false)
      return
    }

    loadAccessibleBooks()
  }, [user])

  const loadAccessibleBooks = async () => {
    if (!user) return

    try {
      // Get user's active subscriptions
      const subscriptionsQuery = query(
        collection(db, "ebookSubscriptions"),
        where("userId", "==", user.uid),
        where("status", "==", "active")
      )
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
      
      if (subscriptionsSnapshot.empty) {
        setAccessibleBooks([])
        setLoading(false)
        return
      }

      const activeSubscriptions = subscriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Get all books that user has access to
      const accessibleBookIds = new Set<string>()
      
      for (const subscription of activeSubscriptions) {
        if (subscription.planType === 'multiple' && (subscription.planTitle === 'Premium' || subscription.planTitle === 'Lifetime')) {
          // Premium and Lifetime plans have access to all books
          const allBooksQuery = query(collection(db, "books"))
          const allBooksSnapshot = await getDocs(allBooksQuery)
          allBooksSnapshot.docs.forEach(doc => {
            const bookData = doc.data()
            if (bookData.pdfUrl) {
              accessibleBookIds.add(doc.id)
            }
          })
        } else {
          // Other plans have access to selected books only
          subscription.selectedBooks?.forEach((bookId: string) => {
            accessibleBookIds.add(bookId)
          })
        }
      }

      // Fetch book details for accessible books
      const books: BookWithEbook[] = []
      for (const bookId of accessibleBookIds) {
        const bookDoc = await getDoc(doc(db, "books", bookId))
        if (bookDoc.exists()) {
          const bookData = bookDoc.data()
          if (bookData.pdfUrl) {
            books.push({
              id: bookDoc.id,
              ...bookData,
              createdAt: bookData.createdAt?.toDate(),
            } as BookWithEbook)
          }
        }
      }

      setAccessibleBooks(books)
    } catch (error) {
      console.error("Error loading accessible books:", error)
    } finally {
      setLoading(false)
    }
  }

  const hasAccessToBook = (bookId: string) => {
    return accessibleBooks.some(book => book.id === bookId)
  }

  return { accessibleBooks, loading, hasAccessToBook, refetch: loadAccessibleBooks }
}