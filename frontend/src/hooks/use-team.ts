"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useTeam() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "team"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTeam(teamData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { team, loading }
}
