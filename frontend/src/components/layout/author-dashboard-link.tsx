"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { BookOpen } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AuthorDashboardLinkProps {
  isMobile?: boolean
}

export function AuthorDashboardLink({ isMobile = false }: AuthorDashboardLinkProps) {
  const [isAuthor, setIsAuthor] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      checkAuthorStatus()
    } else {
      setIsAuthor(false)
      setLoading(false)
    }
  }, [user])

  const checkAuthorStatus = async () => {
    if (!user) return
    
    try {
      // Check if user is an author
      const authorsQuery = query(collection(db, "authors"), where("uid", "==", user.uid))
      const authorsSnapshot = await getDocs(authorsQuery)
      
      setIsAuthor(!authorsSnapshot.empty)
    } catch (error) {
      console.error("Error checking author status:", error)
      setIsAuthor(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !isAuthor) {
    return null
  }

  if (isMobile) {
    return (
      <Link to="/author/dashboard">
        <Button variant="outline" className="w-full justify-start">
          <BookOpen className="w-4 h-4 mr-2" />
          Author Dashboard
        </Button>
      </Link>
    )
  }

  return (
    <DropdownMenuItem asChild>
      <Link to="/author/dashboard">
        <BookOpen className="mr-2 h-4 w-4" />
        Author Dashboard
      </Link>
    </DropdownMenuItem>
  )
}