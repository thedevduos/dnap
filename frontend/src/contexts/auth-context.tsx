"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', {
        user: user ? {
          email: user.email,
          photoURL: user.photoURL,
          displayName: user.displayName,
          uid: user.uid,
          providerData: user.providerData
        } : null
      })
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      console.log('Google login result:', {
        user: result.user ? {
          email: result.user.email,
          photoURL: result.user.photoURL,
          displayName: result.user.displayName,
          uid: result.user.uid
        } : null
      })
    } catch (error) {
      console.error('Google login error:', error)
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    user,
    login,
    loginWithGoogle,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}