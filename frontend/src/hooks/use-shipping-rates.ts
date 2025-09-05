"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ShippingRate } from "@/lib/shipping-rates-utils"

export function useShippingRates() {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "shippingRates"), orderBy("minWeight", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ratesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ShippingRate[]
      setShippingRates(ratesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { shippingRates, loading }
}
