"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useCareers() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, "jobs"), 
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setJobs(jobsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { jobs, loading }
} 