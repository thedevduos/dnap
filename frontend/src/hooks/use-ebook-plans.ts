"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { EbookPlan } from "@/types/ebook"

export function useEbookPlans() {
  const [plans, setPlans] = useState<EbookPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "ebookPlans"), orderBy("price", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EbookPlan[]
      setPlans(plansData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { plans, loading }
}