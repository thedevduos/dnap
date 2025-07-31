"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useShippingMethods() {
  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "shippingMethods"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const methodsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setShippingMethods(methodsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { shippingMethods, loading }
}