"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface HeroBanner {
  id: string
  title: string
  imageUrl: string
  redirectType: 'page' | 'link'
  redirectValue: string
  isActive: boolean
  order: number
  createdAt: any
  updatedAt: any
}

export function useHeroBanners() {
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "heroBanners"), orderBy("order", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HeroBanner[]
      setHeroBanners(bannersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { heroBanners, loading }
}
