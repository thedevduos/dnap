"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { EbookOrder } from "@/types/ebook"

export function useEbookOrders() {
  const [orders, setOrders] = useState<EbookOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "ebookOrders"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as EbookOrder[]
      setOrders(ordersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { orders, loading }
} 