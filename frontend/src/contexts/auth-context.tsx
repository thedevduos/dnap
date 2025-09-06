"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  UserCredential,
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser
} from "firebase/auth"
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs, getDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { db } from "@/lib/firebase"
import { subscribeToNewsletter } from "@/lib/firebase-utils"
import { sendCustomerWelcomeEmail } from "@/lib/email-utils"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<UserCredential>
  register: (userData: RegisterData) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  initialized: boolean
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
  
  // Check if the provider has been initialized
  if (!context.initialized) {
    return {
      user: null,
      login: async () => ({} as UserCredential),
      register: async () => {},
      loginWithGoogle: async () => {},
      logout: async () => {},
      loading: true,
      initialized: false
    }
  }
  
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is suspended
        try {
          const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid))
          if (userProfileDoc.exists()) {
            const userData = userProfileDoc.data()
            if (userData.suspended) {
              // Sign out suspended users immediately
              await signOut(auth)
              setUser(null)
              setLoading(false)
              setInitialized(true)
              return
            }
          }
        } catch (error) {
          console.error('Error checking suspension status:', error)
        }
      }
      
      setUser(user)
      setLoading(false)
      setInitialized(true)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Check if user is suspended
    const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid))
    if (userProfileDoc.exists()) {
      const userData = userProfileDoc.data()
      if (userData.suspended) {
        // Sign out the user immediately
        await signOut(auth)
        // Throw a custom error for suspended accounts
        const error = new Error('ACCOUNT_SUSPENDED')
        ;(error as any).code = 'auth/account-suspended'
        throw error
      }
    }
    
    return userCredential
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
        role: 'customer', // Set default role as customer for regular registrations
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

      // Send welcome email
      try {
        await sendCustomerWelcomeEmail({
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          mobile: userData.phone,
        })
      } catch (error) {
        console.warn("Failed to send welcome email:", error)
        // Don't throw error here as user was created successfully
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
      console.log('Google login result:', result)
      
      // Check if user exists in database
      const user = result.user
      
      // Check if user exists in userProfiles collection (for regular customers)
      const userProfileDoc = await getDoc(doc(db, "userProfiles", user.uid))
      
      // Also check if user exists in users collection (for authors/admins)
      const usersQuery = query(collection(db, "users"), where("email", "==", user.email))
      const usersSnapshot = await getDocs(usersQuery)
      
      // User must exist in either userProfiles or users collection
      if (!userProfileDoc.exists() && usersSnapshot.empty) {
        // User doesn't exist in either collection, delete the user from Firebase Auth and throw error
        try {
          await deleteUser(user)
          console.log('User deleted from Firebase Authentication')
        } catch (deleteError) {
          console.warn('Failed to delete user from Firebase Auth:', deleteError)
          // Still sign out even if deletion fails
          await signOut(auth)
        }
        
        const error = new Error('USER_NOT_FOUND')
        ;(error as any).email = user.email
        throw error
      }
      
      // Check if user is suspended in userProfiles collection (if they exist there)
      if (userProfileDoc.exists()) {
        const userData = userProfileDoc.data()
        if (userData.suspended) {
          // Sign out the user immediately
          await signOut(auth)
          // Throw a custom error for suspended accounts
          const error = new Error('ACCOUNT_SUSPENDED')
          ;(error as any).code = 'auth/account-suspended'
          throw error
        }
      }
      
      console.log('User found in database and not suspended, allowing login')
      // Let the user context handle profile creation/loading
      // This avoids race conditions and ensures consistent logic
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
    initialized,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}