"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { EbookSubscription } from "@/types/ebook"

export function useEbookSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<EbookSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setSubscriptions([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "ebookSubscriptions"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subscriptionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as EbookSubscription[]
      setSubscriptions(subscriptionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { subscriptions, loading }
}