import { 
  doc, 
  getDoc, 
  serverTimestamp,
  runTransaction 
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Generate the next order number in the DNAP/X format
 * This function uses a transaction to ensure atomicity and prevent duplicate order numbers
 */
export const generateNextOrderNumber = async (): Promise<string> => {
  const orderCounterRef = doc(db, 'orderCounters', 'main')
  
  try {
    return await runTransaction(db, async (transaction) => {
      const orderCounterDoc = await transaction.get(orderCounterRef)
      
      let currentCount: number
      
      if (!orderCounterDoc.exists()) {
        // First order - initialize counter
        currentCount = 0
        transaction.set(orderCounterRef, {
          count: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      } else {
        currentCount = orderCounterDoc.data().count || 0
      }
      
      // Increment the counter
      const newCount = currentCount + 1
      
      // Update the counter
      transaction.update(orderCounterRef, {
        count: newCount,
        updatedAt: serverTimestamp()
      })
      
      // Generate order number in DNAP/X format
      return `DNAP/${newCount}`
    })
  } catch (error) {
    console.error('Error generating order number:', error)
    throw new Error('Failed to generate order number')
  }
}

/**
 * Get the current order counter value (for display purposes)
 */
export const getCurrentOrderCounter = async (): Promise<number> => {
  try {
    const orderCounterRef = doc(db, 'orderCounters', 'main')
    const orderCounterDoc = await getDoc(orderCounterRef)
    
    if (!orderCounterDoc.exists()) {
      return 0
    }
    
    return orderCounterDoc.data().count || 0
  } catch (error) {
    console.error('Error getting order counter:', error)
    return 0
  }
}

/**
 * Format order number for display (adds leading zeros for consistent formatting)
 * DNAP/1, DNAP/2, ..., DNAP/9, DNAP/10, DNAP/11, etc.
 */
export const formatOrderNumber = (orderNumber: string): string => {
  return orderNumber // DNAP/X format is already clean and doesn't need additional formatting
}

/**
 * Extract the numeric part from an order number
 * DNAP/123 -> 123
 */
export const extractOrderNumber = (orderNumber: string): number => {
  const match = orderNumber.match(/DNAP\/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}
