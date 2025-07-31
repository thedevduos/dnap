"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Transaction {
  id: string
  status?: "success" | "pending" | "failed" | "refunded"
  amount?: number
  [key: string]: any
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    successful: 0,
    failed: 0,
    refunded: 0,
  })

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setTransactions(transactionsData)

      // Calculate analytics
      const totalRevenue = transactionsData
        .filter(t => t.status === "success")
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      
      const successful = transactionsData.filter(t => t.status === "success").length
      const failed = transactionsData.filter(t => t.status === "failed").length
      const refunded = transactionsData
        .filter(t => t.status === "refunded")
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      setAnalytics({ totalRevenue, successful, failed, refunded })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { transactions, loading, analytics }
}