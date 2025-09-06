"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, where, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { AuthorBook } from "@/types/author"

export function useAuthorBooks() {
  const [books, setBooks] = useState<AuthorBook[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setBooks([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "authorBooks"), 
      where("authorId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const booksData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const bookData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate(),
            updatedAt: docSnapshot.data().updatedAt?.toDate(),
          } as AuthorBook

          // If book is completed and has assignedBookId, fetch the cover image from main books collection
          if (bookData.stage === 'completed' && bookData.assignedBookId) {
            try {
              const bookDoc = await getDoc(doc(db, "books", bookData.assignedBookId))
              if (bookDoc.exists()) {
                const mainBookData = bookDoc.data()
                bookData.imageUrl = mainBookData.imageUrl || bookData.imageUrl
              }
            } catch (error) {
              console.error('Error fetching book image:', error)
            }
          }

          return bookData
        })
      )
      setBooks(booksData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { books, loading }
}