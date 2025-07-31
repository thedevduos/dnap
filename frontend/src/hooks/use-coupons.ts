"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useCoupons() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const couponsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCoupons(couponsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { coupons, loading }
}