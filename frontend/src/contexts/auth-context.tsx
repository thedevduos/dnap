"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { subscribeToNewsletter } from "@/lib/firebase-utils"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  subscribeNewsletter: boolean
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

  const register = async (userData: RegisterData) => {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
      const user = userCredential.user

      // Update user profile
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      })

      // Create user profile document
      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        email: userData.email,
        displayName: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        addresses: [],
        preferences: {
          newsletter: userData.subscribeNewsletter,
          notifications: true,
          language: 'en'
        },
        orderHistory: [],
        wishlist: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Subscribe to newsletter if requested
      if (userData.subscribeNewsletter) {
        try {
          await subscribeToNewsletter(userData.email)
        } catch (error) {
          console.warn("Failed to subscribe to newsletter:", error)
        }
      }

    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Create or update user profile for Google users
      await setDoc(doc(db, "userProfiles", user.uid), {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        phone: user.phoneNumber || '',
        addresses: [],
        preferences: {
          newsletter: true,
          notifications: true,
          language: 'en'
        },
        orderHistory: [],
        wishlist: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })

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
    register,
    loginWithGoogle,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}