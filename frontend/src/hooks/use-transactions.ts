"use client"

import { useState, useEffect, useRef } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Transaction {
  id: string
  status?: "success" | "pending" | "failed" | "refunded"
  amount?: number
  paymentMethod?: string
  orderId?: string
  gatewayTransactionId?: string
  customerName?: string
  customerEmail?: string
  createdAt?: any
  refundStatus?: string
  refundAmount?: number
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
  refundAmount?: number
  gatewayTransactionId?: string
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pgTransactions, setPgTransactions] = useState<PaymentGatewayTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [pgLoading, setPgLoading] = useState(false)
  const pgFetchedRef = useRef(false)
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    successful: 0,
    failed: 0,
    refunded: 0,
    totalTransactions: 0,
  })

  // Fetch transactions from Firestore with proper error handling
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    try {
      const q = query(
        collection(db, "transactions"), 
        orderBy("createdAt", "desc")
      )

      unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          try {
            const transactionsData: Transaction[] = snapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                // Ensure consistent data types
                amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount || '0'),
                status: data.status || 'pending',
                paymentMethod: data.paymentMethod || 'razorpay',
                orderId: data.orderId || '',
                gatewayTransactionId: data.gatewayTransactionId || data.transactionId || '',
                customerName: data.customerName || '',
                customerEmail: data.customerEmail || '',
                refundStatus: data.refundStatus || null,
                refundAmount: typeof data.refundAmount === 'number' ? data.refundAmount : parseFloat(data.refundAmount || '0')
              }
            })

            setTransactions(transactionsData)
            setLoading(false)
          } catch (error) {
            console.error("Error processing Firestore transactions:", error)
            setTransactions([])
            setLoading(false)
          }
        },
        (error) => {
          console.error("Error fetching transactions from Firestore:", error)
          setTransactions([])
          setLoading(false)
        }
      )
    } catch (error) {
      console.error("Error setting up Firestore listener:", error)
      setLoading(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Fetch transactions from payment gateways with better error handling
  useEffect(() => {
    const fetchPgTransactions = async () => {
      if (pgFetchedRef.current) return
      
      pgFetchedRef.current = true
      setPgLoading(true)
      
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_API_URL
        if (!backendUrl) {
          console.warn('Backend API URL not configured, skipping payment gateway transactions')
          setPgLoading(false)
          return
        }

        const response = await fetch(`${backendUrl}/api/payment/all-transactions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          const allPgTransactions: PaymentGatewayTransaction[] = []
          

          
          // Process Razorpay transactions safely
          if (result.data.razorpay?.success && Array.isArray(result.data.razorpay.transactions)) {
            const razorpayTransactions = result.data.razorpay.transactions.map((t: any) => ({
              id: t.id || `razorpay_${Date.now()}_${Math.random()}`,
              amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0'),
              status: t.status || 'pending',
              customerName: t.customerName || 'Unknown',
              customerEmail: t.customerEmail || 'No email provided',
              paymentMethod: 'razorpay',
              createdAt: t.createdAt || new Date().toISOString(),
              currency: t.currency || 'INR',
              method: t.method || 'online',
              refundStatus: t.refundStatus || null,
              orderId: t.orderId || '',
              refundAmount: typeof t.refundAmount === 'number' ? t.refundAmount : parseFloat(t.refundAmount || '0')
            }))
            allPgTransactions.push(...razorpayTransactions)
          }
          
          // Process Zoho Pay transactions safely
          if (result.data.zoho?.success && Array.isArray(result.data.zoho.transactions)) {
            const zohoTransactions = result.data.zoho.transactions.map((t: any) => ({
              id: t.id || `zoho_${Date.now()}_${Math.random()}`,
              amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0'),
              status: t.status || 'pending',
              customerName: t.customerName || 'Unknown',
              customerEmail: t.customerEmail || 'No email provided',
              paymentMethod: 'zoho',
              createdAt: t.createdAt || new Date().toISOString(),
              currency: t.currency || 'INR',
              method: t.method || 'online',
              refundStatus: t.refundStatus || null,
              orderId: t.orderId || '',
              refundAmount: typeof t.refundAmount === 'number' ? t.refundAmount : parseFloat(t.refundAmount || '0')
            }))
            allPgTransactions.push(...zohoTransactions)
          }

          // Sort by creation date (newest first)
          allPgTransactions.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return dateB - dateA
          })
          
          setPgTransactions(allPgTransactions)
        } else {
          console.warn('Invalid response structure from payment gateway API:', result)
          setPgTransactions([])
        }
      } catch (error) {
        console.error('Error fetching payment gateway transactions:', error)
        setPgTransactions([])
      } finally {
        setPgLoading(false)
      }
    }

    fetchPgTransactions()
  }, [])

  // Calculate analytics when transactions change
  useEffect(() => {
    try {
      // Combine Firestore and payment gateway transactions with proper deduplication
      const firestoreIds = new Set(transactions.map(t => t.gatewayTransactionId || t.id))
      
      // Filter out PG transactions that already exist in Firestore
      const uniquePgTransactions = pgTransactions.filter(t => 
        !firestoreIds.has(t.id) && t.id && t.amount > 0
      )
      
      const allTransactions = [...transactions, ...uniquePgTransactions]
      
      // Calculate analytics with proper error handling
      const totalRevenue = allTransactions
        .filter(t => t.status === "success" && typeof t.amount === 'number')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      
      const successful = allTransactions.filter(t => t.status === "success").length
      const failed = allTransactions.filter(t => t.status === "failed").length
      
      // Calculate refunded amount more accurately
      const refunded = allTransactions
        .filter(t => 
          t.status === "refunded" || 
          t.refundStatus === "partial" || 
          t.refundStatus === "full" ||
          (t.refundAmount && t.refundAmount > 0)
        )
        .reduce((sum, t) => {
          if (t.refundAmount && typeof t.refundAmount === 'number') {
            return sum + t.refundAmount
          }
          if (t.status === "refunded" && typeof t.amount === 'number') {
            return sum + t.amount
          }
          return sum
        }, 0)

      setAnalytics({ 
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        successful, 
        failed, 
        refunded: Math.round(refunded * 100) / 100,
        totalTransactions: allTransactions.length
      })
    } catch (error) {
      console.error('Error calculating analytics:', error)
      setAnalytics({
        totalRevenue: 0,
        successful: 0,
        failed: 0,
        refunded: 0,
        totalTransactions: 0
      })
    }
  }, [transactions, pgTransactions])

  // Combine transactions with proper deduplication
  const combinedTransactions = [
    ...transactions,
    ...pgTransactions.filter(t => 
      !transactions.some(ft => 
        ft.gatewayTransactionId === t.id || 
        ft.id === t.id
      ) && t.id && t.amount > 0
    )
  ]

  return { 
    transactions: combinedTransactions, 
    loading: loading || pgLoading, 
    analytics,
    pgTransactions,
    firestoreTransactions: transactions
  }
}