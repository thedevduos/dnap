"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  photoURL?: string
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
  isAuthor: boolean
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
  const { user, loading: authLoading, initialized: authInitialized } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (authLoading || !authInitialized) {
      // Don't do anything while auth is still loading or not initialized
      return
    }
    
    if (user) {
      loadUserProfile(user)
    } else {
      setUserProfile(null)
      setLoading(false)
    }
  }, [user, authLoading, authInitialized])

  const loadUserProfile = async (authUser: User) => {
    try {
      
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
          // Update photoURL if it's different from the stored one
          const updatedProfile = {
            ...data,
            photoURL: authUser.photoURL || data.photoURL || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserProfile

          // If the photoURL has changed, update it in Firestore
          if (authUser.photoURL && authUser.photoURL !== data.photoURL) {
            try {
              await updateDoc(doc(db, "userProfiles", authUser.uid), {
                photoURL: authUser.photoURL,
                updatedAt: serverTimestamp()
              })
            } catch (error) {
              console.warn('Failed to update photoURL in Firestore:', error)
            }
          }

          setUserProfile(updatedProfile)
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
              photoURL: authUser.photoURL || '',
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
            // User is not an admin, check if profile was just created by registration
            // Add a small delay to allow for registration to complete
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Check again if profile exists (it might have been created during registration)
            const retryUserDoc = await getDoc(doc(db, "userProfiles", authUser.uid))
            
            if (retryUserDoc.exists()) {
              const data = retryUserDoc.data()
              console.log('Found user profile after retry:', data)
              const updatedProfile = {
                ...data,
                photoURL: authUser.photoURL || data.photoURL || '',
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              } as UserProfile
              setUserProfile(updatedProfile)
            } else {
              // User is not an admin and no profile exists, create regular customer profile
              console.log('Creating new customer profile for:', authUser.email)
              
              // Double-check that no profile exists with this email (extra safety)
              const emailCheckQuery = query(
                collection(db, "userProfiles"),
                where("email", "==", authUser.email)
              )
              const emailCheckSnapshot = await getDocs(emailCheckQuery)
              
              if (!emailCheckSnapshot.empty) {
                console.log('Profile already exists for email, using existing profile')
                const existingProfileDoc = emailCheckSnapshot.docs[0]
                const existingProfile = { id: existingProfileDoc.id, ...existingProfileDoc.data() } as UserProfile
                setUserProfile(existingProfile)
                return
              }
              
              const newProfile: UserProfile = {
                id: authUser.uid,
                email: authUser.email || '',
                displayName: authUser.displayName || '',
                role: 'customer', // Default role for new users
                photoURL: authUser.photoURL || '',
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
      
      // Get book title for toast message
      try {
        const bookDoc = await getDoc(doc(db, "books", bookId))
        const bookTitle = bookDoc.exists() ? bookDoc.data().title : "Book"
        
        toast({
          title: "Added to Wishlist",
          description: `${bookTitle} has been added to your wishlist`,
        })
      } catch (error) {
        toast({
          title: "Added to Wishlist",
          description: "Book has been added to your wishlist",
        })
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to add book to wishlist",
        variant: "destructive",
      })
      throw error
    }
  }

  const removeFromWishlist = async (bookId: string) => {
    if (!userProfile) return

    try {
      const updatedWishlist = userProfile.wishlist.filter(id => id !== bookId)
      await updateProfile({ wishlist: updatedWishlist })
      
      // Get book title for toast message
      try {
        const bookDoc = await getDoc(doc(db, "books", bookId))
        const bookTitle = bookDoc.exists() ? bookDoc.data().title : "Book"
        
        toast({
          title: "Removed from Wishlist",
          description: `${bookTitle} has been removed from your wishlist`,
        })
      } catch (error) {
        toast({
          title: "Removed from Wishlist",
          description: "Book has been removed from your wishlist",
        })
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to remove book from wishlist",
        variant: "destructive",
      })
      throw error
    }
  }

  const isInWishlist = (bookId: string) => {
    return userProfile?.wishlist.includes(bookId) || false
  }

  const isAdmin = userProfile?.role === 'admin' || false
  const isAuthor = userProfile?.role === 'author' || false
  
  // Consider both auth loading and user profile loading, and auth initialization
  const isLoading = authLoading || loading || !authInitialized

  const value = {
    userProfile,
    loading: isLoading,
    isAdmin,
    isAuthor,
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