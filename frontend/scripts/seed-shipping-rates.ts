// Script to seed default shipping rates
import { addDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../src/lib/firebase'

// Default shipping rates
const defaultShippingRates = [
  {
    minWeight: 0.1,
    maxWeight: 1.0,
    tamilnadu: 40,
    india: 80,
    international: 120
  },
  {
    minWeight: 1.1,
    maxWeight: 2.0,
    tamilnadu: 80,
    india: 120,
    international: 200
  }
]

export async function seedShippingRates() {
  try {
    console.log('Starting to seed shipping rates...')
    
    // Check if shipping rates already exist
    const existingRates = await getDocs(collection(db, 'shippingRates'))
    
    if (existingRates.size > 0) {
      console.log('Shipping rates already exist. Skipping seeding.')
      return
    }
    
    // Add default shipping rates
    for (const rate of defaultShippingRates) {
      await addDoc(collection(db, 'shippingRates'), {
        ...rate,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log(`Added shipping rate: ${rate.minWeight}-${rate.maxWeight} KG`)
    }
    
    console.log('Successfully seeded shipping rates!')
  } catch (error) {
    console.error('Error seeding shipping rates:', error)
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).seedShippingRates = seedShippingRates
}
