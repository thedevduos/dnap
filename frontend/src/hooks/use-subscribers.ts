"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Subscriber {
  id: string
  status?: "active" | "unsubscribed"
  [key: string]: any
}

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    total: 0,
    active: 0,
    unsubscribed: 0,
  })

  useEffect(() => {
    const q = query(collection(db, "subscribers"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subscribersData: Subscriber[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setSubscribers(subscribersData)

      // Calculate analytics
      const total = subscribersData.length
      const active = subscribersData.filter((s) => s.status === "active" || !s.status).length
      const unsubscribed = subscribersData.filter((s) => s.status === "unsubscribed").length

      setAnalytics({ total, active, unsubscribed })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { subscribers, loading, analytics }
}
