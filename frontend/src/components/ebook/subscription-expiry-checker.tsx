"use client"

import { useEffect } from "react"
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function SubscriptionExpiryChecker() {
  useEffect(() => {
    const checkExpiredSubscriptions = async () => {
      try {
        console.log('🔍 Checking for expired e-book subscriptions...')
        
        // Get all active subscriptions
        const subscriptionsQuery = query(
          collection(db, "ebookSubscriptions"),
          where("status", "==", "active")
        )
        
        const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
        const now = new Date()
        let expiredCount = 0
        
        // Check each subscription for expiry
        for (const subscriptionDoc of subscriptionsSnapshot.docs) {
          const subscription = subscriptionDoc.data()
          const endDate = subscription.endDate?.toDate()
          
          if (endDate && endDate <= now) {
            // Subscription has expired, update status
            await updateDoc(doc(db, "ebookSubscriptions", subscriptionDoc.id), {
              status: 'expired',
              updatedAt: serverTimestamp()
            })
            
            expiredCount++
            console.log(`⏰ Expired subscription: ${subscription.planTitle} for user ${subscription.userId}`)
          }
        }
        
        if (expiredCount > 0) {
          console.log(`✅ Updated ${expiredCount} expired subscriptions`)
        } else {
          console.log('✅ No expired subscriptions found')
        }
        
      } catch (error) {
        console.error('❌ Error checking expired subscriptions:', error)
      }
    }
    
    // Check immediately on mount
    checkExpiredSubscriptions()
    
    // Set up interval to check every hour
    const interval = setInterval(checkExpiredSubscriptions, 60 * 60 * 1000) // 1 hour
    
    return () => clearInterval(interval)
  }, [])

  // This component doesn't render anything
  return null
}