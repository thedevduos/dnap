"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = () => {
    setLoading(true)
  }

  useEffect(() => {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testimonialsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTestimonials(testimonialsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { testimonials, loading, refetch }
}
