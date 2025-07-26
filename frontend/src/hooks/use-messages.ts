"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Message {
  id: string
  status?: "unread" | "read" | "replied"
  [key: string]: any
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0,
  })

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setMessages(messagesData)

      // Calculate analytics
      const total = messagesData.length
      const unread = messagesData.filter((m) => m.status === "unread" || !m.status).length
      const read = messagesData.filter((m) => m.status === "read").length
      const replied = messagesData.filter((m) => m.status === "replied").length

      setAnalytics({ total, unread, read, replied })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { messages, loading, analytics }
}
