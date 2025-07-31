"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-context"

interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
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
  isAdmin: boolean
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
      console.log('Loading user profile for:', authUser.email, authUser.uid)
      
      // First check if user exists in users collection (admin users)
      // Check by both uid and email to ensure we find admin users
      const usersQueryByUid = query(collection(db, "users"), where("uid", "==", authUser.uid))
      const usersQueryByEmail = query(collection(db, "users"), where("email", "==", authUser.email))
      
      const [usersSnapshotByUid, usersSnapshotByEmail] = await Promise.all([
        getDocs(usersQueryByUid),
        getDocs(usersQueryByEmail)
      ])
      
      const usersSnapshot = usersSnapshotByUid.empty ? usersSnapshotByEmail : usersSnapshotByUid
      
      if (!usersSnapshot.empty) {
        const adminUser = usersSnapshot.docs[0].data()
        console.log('Found admin user in users collection:', adminUser)
        // Create user profile from admin user data
        const adminProfile: UserProfile = {
          id: authUser.uid,
          email: adminUser.email || authUser.email || '',
          displayName: adminUser.name || authUser.displayName || '',
          firstName: adminUser.name?.split(' ')[0] || '',
          lastName: adminUser.name?.split(' ').slice(1).join(' ') || '',
          phone: adminUser.mobile || '',
          role: adminUser.role || 'admin',
          addresses: [],
          preferences: {
            newsletter: true,
            notifications: true,
            language: 'en'
          },
          orderHistory: [],
          wishlist: [],
          createdAt: adminUser.createdAt?.toDate() || new Date(),
          updatedAt: adminUser.updatedAt?.toDate() || new Date(),
        }
        setUserProfile(adminProfile)
      } else {
        // Check if user exists in userProfiles collection (regular customers)
        const userDoc = await getDoc(doc(db, "userProfiles", authUser.uid))
        
        if (userDoc.exists()) {
          const data = userDoc.data()
          console.log('Found user in userProfiles:', data)
          setUserProfile({
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserProfile)
        } else {
          console.log('User not found in userProfiles, checking if admin...')
          
          // Check if user is an admin in users collection
          // Check by both uid and email to ensure we find admin users
          const usersQueryByUid = query(collection(db, "users"), where("uid", "==", authUser.uid))
          const usersQueryByEmail = query(collection(db, "users"), where("email", "==", authUser.email))
          
          const [usersSnapshotByUid, usersSnapshotByEmail] = await Promise.all([
            getDocs(usersQueryByUid),
            getDocs(usersQueryByEmail)
          ])
          
          const usersSnapshot = usersSnapshotByUid.empty ? usersSnapshotByEmail : usersSnapshotByUid
          
          if (!usersSnapshot.empty) {
            // User is an admin, create admin profile
            const adminUser = usersSnapshot.docs[0].data()
            console.log('Found admin user, creating admin profile:', adminUser)
            
            const adminProfile: UserProfile = {
              id: authUser.uid,
              email: adminUser.email || authUser.email || '',
              displayName: adminUser.name || authUser.displayName || '',
              firstName: adminUser.name?.split(' ')[0] || '',
              lastName: adminUser.name?.split(' ').slice(1).join(' ') || '',
              phone: adminUser.mobile || '',
              role: adminUser.role || 'admin',
              addresses: [],
              preferences: {
                newsletter: true,
                notifications: true,
                language: 'en'
              },
              orderHistory: [],
              wishlist: [],
              createdAt: adminUser.createdAt?.toDate() || new Date(),
              updatedAt: adminUser.updatedAt?.toDate() || new Date(),
            }
            
            // Save the admin profile
            await setDoc(doc(db, "userProfiles", authUser.uid), {
              ...adminProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            
            setUserProfile(adminProfile)
          } else {
            // User is not an admin, create regular customer profile
            console.log('Creating new customer profile for:', authUser.email)
            const newProfile: UserProfile = {
              id: authUser.uid,
              email: authUser.email || '',
              displayName: authUser.displayName || '',
              role: 'customer', // Default role for new users
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
            
            // Save the new profile
            await setDoc(doc(db, "userProfiles", authUser.uid), {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            
            setUserProfile(newProfile)
          }
        }
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
      // Generate a more unique ID using timestamp + random number
      const newAddress: Address = {
        ...address,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  const isAdmin = userProfile?.role === 'admin' || false
  
  console.log('User context debug:', { 
    userProfile: userProfile ? { 
      email: userProfile.email, 
      role: userProfile.role,
      displayName: userProfile.displayName 
    } : null, 
    isAdmin, 
    loading 
  })

  const value = {
    userProfile,
    loading,
    isAdmin,
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