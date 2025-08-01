"use client"

import { useState, useEffect, useRef } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Transaction {
  id: string
  status?: "success" | "pending" | "failed" | "refunded"
  amount?: number
  paymentMethod?: string
  [key: string]: any
}

interface PaymentGatewayTransaction {
  id: string
  amount: number
  status: string
  customerName: string
  customerEmail: string
  paymentMethod: string
  createdAt: string
  currency?: string
  method?: string
  refundStatus?: string
  orderId?: string
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pgTransactions, setPgTransactions] = useState<PaymentGatewayTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [_pgLoading, setPgLoading] = useState(false)
  const pgFetchedRef = useRef(false)
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    successful: 0,
    failed: 0,
    refunded: 0,
    totalTransactions: 0,
  })

  // Fetch transactions from Firestore
  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setTransactions(transactionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Fetch transactions from payment gateways
  useEffect(() => {
    const fetchPgTransactions = async () => {
      if (pgFetchedRef.current) return // Prevent multiple calls
      
      pgFetchedRef.current = true
      setPgLoading(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/all-transactions`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment gateway transactions')
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          const allPgTransactions: PaymentGatewayTransaction[] = []
          
          // Process PayU transactions
          if (result.data.payu?.transactions) {
            allPgTransactions.push(...result.data.payu.transactions)
          }
          
          // Process Razorpay transactions (amount is already converted to rupees)
          if (result.data.razorpay?.transactions) {
            allPgTransactions.push(...result.data.razorpay.transactions)
          }
          


          // Sort by creation date (newest first)
          allPgTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          
          setPgTransactions(allPgTransactions)
        }
      } catch (error) {
        console.error('Error fetching payment gateway transactions:', error)
      } finally {
        setPgLoading(false)
      }
    }

    fetchPgTransactions()
  }, [])

  // Calculate analytics when transactions change
  useEffect(() => {
    // Combine Firestore and payment gateway transactions with deduplication
    const firestoreIds = new Set(transactions.map(t => t.id))
    
    // Filter out PG transactions that already exist in Firestore
    const uniquePgTransactions = pgTransactions.filter(t => !firestoreIds.has(t.id))
    
    const allTransactions = [...transactions, ...uniquePgTransactions]
    
    // Debug logging
    console.log('Firestore transactions:', transactions.length)
    console.log('PG transactions:', pgTransactions.length)
    console.log('Unique PG transactions:', uniquePgTransactions.length)
    console.log('Total combined transactions:', allTransactions.length)
    
    const totalRevenue = allTransactions
      .filter(t => t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const successful = allTransactions.filter(t => t.status === "success").length
    const failed = allTransactions.filter(t => t.status === "failed").length
    const refunded = allTransactions
      .filter(t => t.status === "refunded" || t.refundStatus === "partial" || t.refundStatus === "full")
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    setAnalytics({ 
      totalRevenue, 
      successful, 
      failed, 
      refunded,
      totalTransactions: allTransactions.length
    })
  }, [transactions, pgTransactions])

  return { 
    transactions: [...transactions, ...pgTransactions.filter(t => !transactions.some(ft => ft.id === t.id))], 
    loading, 
    analytics,
    pgTransactions 
  }
}