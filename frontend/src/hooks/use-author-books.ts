"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as AuthorBook[]
      setBooks(booksData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { books, loading }
}