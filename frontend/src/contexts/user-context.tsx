"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-context"

interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  phone?: string
  addresses: Address[]
  preferences: {
    newsletter: boolean
    notifications: boolean
    language: string
  }
  orderHistory: string[]
  wishlist: string[]
  createdAt: Date
  updatedAt: Date
}

interface Address {
  id: string
  type: 'home' | 'work' | 'other'
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
}

interface UserContextType {
  userProfile: UserProfile | null
  loading: boolean
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>
  updateAddress: (addressId: string, updates: Partial<Address>) => Promise<void>
  removeAddress: (addressId: string) => Promise<void>
  setDefaultAddress: (addressId: string) => Promise<void>
  addToWishlist: (bookId: string) => Promise<void>
  removeFromWishlist: (bookId: string) => Promise<void>
  isInWishlist: (bookId: string) => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadUserProfile(user)
    } else {
      setUserProfile(null)
      setLoading(false)
    }
  }, [user])

  const loadUserProfile = async (authUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, "userProfiles", authUser.uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserProfile({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile)
      } else {
        // Create new user profile
        const newProfile: UserProfile = {
          id: authUser.uid,
          email: authUser.email || '',
          displayName: authUser.displayName || '',
          addresses: [],
          preferences: {
            newsletter: true,
            notifications: true,
            language: 'en'
          },
          orderHistory: [],
          wishlist: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await setDoc(doc(db, "userProfiles", authUser.uid), {
          ...newProfile,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        setUserProfile(newProfile)
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile || !user) return

    try {
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, "userProfiles", user.uid), {
        ...updates,
        updatedAt: new Date()
      })

      setUserProfile(updatedProfile)
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!userProfile || !user) return

    try {
      const newAddress: Address = {
        ...address,
        id: Date.now().toString(),
      }

      const updatedAddresses = [...userProfile.addresses, newAddress]
      
      await updateProfile({ addresses: updatedAddresses })
    } catch (error) {
      console.error("Error adding address:", error)
      throw error
    }
  }

  const updateAddress = async (addressId: string, updates: Partial<Address>) => {
    if (!userProfile) return

    try {
      const updatedAddresses = userProfile.addresses.map(addr =>
        addr.id === addressId ? { ...addr, ...updates } : addr
      )
      
      await updateProfile({ addresses: updatedAddresses })
    } catch (error) {
      console.error("Error updating address:", error)
      throw error
    }
  }

  const removeAddress = async (addressId: string) => {
    if (!userProfile) return

    try {
      const updatedAddresses = userProfile.addresses.filter(addr => addr.id !== addressId)
      await updateProfile({ addresses: updatedAddresses })
    } catch (error) {
      console.error("Error removing address:", error)
      throw error
    }
  }

  const setDefaultAddress = async (addressId: string) => {
    if (!userProfile) return

    try {
      const updatedAddresses = userProfile.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
      
      await updateProfile({ addresses: updatedAddresses })
    } catch (error) {
      console.error("Error setting default address:", error)
      throw error
    }
  }

  const addToWishlist = async (bookId: string) => {
    if (!userProfile || userProfile.wishlist.includes(bookId)) return

    try {
      const updatedWishlist = [...userProfile.wishlist, bookId]
      await updateProfile({ wishlist: updatedWishlist })
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      throw error
    }
  }

  const removeFromWishlist = async (bookId: string) => {
    if (!userProfile) return

    try {
      const updatedWishlist = userProfile.wishlist.filter(id => id !== bookId)
      await updateProfile({ wishlist: updatedWishlist })
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      throw error
    }
  }

  const isInWishlist = (bookId: string) => {
    return userProfile?.wishlist.includes(bookId) || false
  }

  const value = {
    userProfile,
    loading,
    updateProfile,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}