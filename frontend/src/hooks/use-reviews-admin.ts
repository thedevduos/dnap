"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateReview, deleteReview } from "@/lib/firebase-utils"

interface Review {
  id: string
  bookId: string
  bookTitle?: string
  userId: string
  userName: string
  rating: number
  comment: string
  status: string
  helpful: number
  createdAt: any
  [key: string]: any
}

export function useReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageRating: 0,
  })

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reviewsData: Review[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        console.log('Raw review data:', data) // Debug log
        return {
          id: doc.id,
          ...data,
        }
      }) as Review[]

      // Fetch book titles for all reviews
      const reviewsWithBookTitles = await Promise.all(
        reviewsData.map(async (review) => {
          try {
            console.log('Processing review:', review.id, 'bookId:', review.bookId) // Debug log
            const bookDoc = await getDoc(doc(db, "books", review.bookId))
            if (bookDoc.exists()) {
              const bookData = bookDoc.data()
              console.log('Book data:', bookData) // Debug log
              return {
                ...review,
                bookTitle: bookData.title
              }
            }
            return review
          } catch (error) {
            console.error("Error fetching book title:", error)
            return review
          }
        })
      )

      setReviews(reviewsWithBookTitles)

      // Calculate analytics
      const total = reviewsWithBookTitles.length
      const approved = reviewsWithBookTitles.filter((r) => r.status === "approved").length
      const pending = reviewsWithBookTitles.filter((r) => r.status === "pending").length
      const rejected = reviewsWithBookTitles.filter((r) => r.status === "rejected").length
      const averageRating = total > 0 
        ? reviewsWithBookTitles.reduce((sum, review) => sum + review.rating, 0) / total 
        : 0

      setAnalytics({ total, approved, pending, rejected, averageRating })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const updateReviewStatus = async (reviewId: string, status: string) => {
    return await updateReview(reviewId, { status })
  }

  const deleteReviewById = async (reviewId: string) => {
    return await deleteReview(reviewId)
  }

  const refetch = () => {
    setLoading(true)
  }

  return { reviews, loading, analytics, updateReviewStatus, deleteReview: deleteReviewById, refetch }
} 