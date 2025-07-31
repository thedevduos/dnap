"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Order {
  id: string
  status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  [key: string]: any
}

export function useOrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  })

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setOrders(ordersData)

      // Calculate analytics
      const total = ordersData.length
      const pending = ordersData.filter((o) => o.status === "pending").length
      const confirmed = ordersData.filter((o) => o.status === "confirmed").length
      const shipped = ordersData.filter((o) => o.status === "shipped").length
      const delivered = ordersData.filter((o) => o.status === "delivered").length
      const cancelled = ordersData.filter((o) => o.status === "cancelled").length

      setAnalytics({ total, pending, confirmed, shipped, delivered, cancelled })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { orders, loading, analytics }
}