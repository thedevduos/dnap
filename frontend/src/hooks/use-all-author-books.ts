"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AuthorBook } from "@/types/author"

export function useAllAuthorBooks() {
  const [books, setBooks] = useState<AuthorBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "authorBooks"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const booksData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data()
          const book = {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as AuthorBook

          // Fetch author email if not already present
          if (!book.authorEmail && book.authorId) {
            try {
              const authorDoc = await getDoc(doc(db, "authors", book.authorId))
              if (authorDoc.exists()) {
                book.authorEmail = authorDoc.data().email
              }
            } catch (error) {
              console.error('Error fetching author email:', error)
            }
          }

          return book
        })
      )
      
      setBooks(booksData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { books, loading }
}