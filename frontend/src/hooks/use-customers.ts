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

      // Deduplicate customers based on email address
      const uniqueCustomers = customersData.reduce((acc: Customer[], current) => {
        const existingCustomer = acc.find(customer => customer.email === current.email)
        if (!existingCustomer) {
          acc.push(current)
        } else {
          // If duplicate found, keep the one with more recent createdAt or more complete data
          if (current.createdAt && existingCustomer.createdAt) {
            if (current.createdAt.toDate() > existingCustomer.createdAt.toDate()) {
              const index = acc.findIndex(customer => customer.email === current.email)
              acc[index] = current
            }
          } else if (current.displayName && !existingCustomer.displayName) {
            // Prefer customer with display name
            const index = acc.findIndex(customer => customer.email === current.email)
            acc[index] = current
          }
        }
        return acc
      }, [])

      // Log deduplication info for debugging
      if (customersData.length !== uniqueCustomers.length) {
        console.log(`Deduplicated customers: ${customersData.length} -> ${uniqueCustomers.length}`)
      }

      setCustomers(uniqueCustomers)

      // Calculate analytics using deduplicated data
      const total = uniqueCustomers.length
      const active = uniqueCustomers.filter(c => !c.suspended).length
      const newsletter = uniqueCustomers.filter(c => c.preferences?.newsletter).length
      const withOrders = uniqueCustomers.filter(c => (c.orderCount || 0) > 0).length

      setAnalytics({ total, active, newsletter, withOrders })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { customers, loading, analytics }
}