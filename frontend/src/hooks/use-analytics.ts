"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [
          booksSnapshot,
          teamSnapshot,
          messagesSnapshot,
          subscribersSnapshot,
          testimonialsSnapshot,
          updatesSnapshot,
        ] = await Promise.all([
          getDocs(collection(db, "books")),
          getDocs(collection(db, "team")),
          getDocs(collection(db, "messages")),
          getDocs(collection(db, "subscribers")),
          getDocs(collection(db, "testimonials")),
          getDocs(collection(db, "updates")),
        ])

        setAnalytics({
          totalBooks: booksSnapshot.size,
          totalTeamMembers: teamSnapshot.size,
          totalMessages: messagesSnapshot.size,
          totalSubscribers: subscribersSnapshot.size,
          totalTestimonials: testimonialsSnapshot.size,
          totalUpdates: updatesSnapshot.size,
        })
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return { analytics, loading }
}
