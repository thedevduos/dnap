"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Customer {
  id: string
  preferences?: {
    newsletter?: boolean
  }
  orderCount?: number
  totalSpent?: number
  [key: string]: any
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    total: 0,
    active: 0,
    newsletter: 0,
    withOrders: 0,
  })

  useEffect(() => {
    const q = query(collection(db, "userProfiles"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData: Customer[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setCustomers(customersData)

      // Calculate analytics
      const total = customersData.length
      const active = customersData.filter(c => !c.suspended).length
      const newsletter = customersData.filter(c => c.preferences?.newsletter).length
      const withOrders = customersData.filter(c => (c.orderCount || 0) > 0).length

      setAnalytics({ total, active, newsletter, withOrders })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { customers, loading, analytics }
}