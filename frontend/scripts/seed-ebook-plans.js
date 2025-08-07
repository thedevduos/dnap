import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const ebookPlans = [
  // Multiple E-book Plans
  {
    title: "Basic",
    price: 129,
    period: "/month",
    description: "3 Books per month",
    type: "multiple",
    features: [
      "3 Books per month",
      "Online reading only", 
      "Multiple formats (PDF, EPUB)",
      "Customer support"
    ],
    maxBooks: 3,
    duration: 30,
    popular: false,
    status: "active"
  },
  {
    title: "Standard",
    price: 299,
    period: "/month", 
    description: "10 Books per month",
    type: "multiple",
    features: [
      "10 Books per month",
      "Online reading only",
      "Priority customer support", 
      "New releases included"
    ],
    maxBooks: 10,
    duration: 30,
    popular: true,
    status: "active"
  },
  {
    title: "Premium",
    price: 499,
    period: "/month",
    description: "Unlimited Books per month", 
    type: "multiple",
    features: [
      "Unlimited Books per month",
      "Online reading only",
      "VIP customer support",
      "Early access to new releases",
      "Exclusive content"
    ],
    duration: 30,
    popular: false,
    status: "active"
  },
  {
    title: "Lifetime",
    price: 4999,
    period: "one-time",
    description: "Unlimited for 5 years",
    type: "multiple", 
    features: [
      "Unlimited access for 5 years",
      "Online reading only",
      "All future releases included",
      "VIP customer support",
      "Exclusive lifetime member perks"
    ],
    duration: 1825, // 5 years in days
    popular: false,
    status: "active"
  },
  
  // Single E-book Plans
  {
    title: "Basic Single",
    price: 49,
    period: "/month",
    description: "Limited Collection Only",
    type: "single",
    features: [
      "Limited collection access",
      "Online reading only",
      "Multiple formats (PDF, EPUB)", 
      "Customer support"
    ],
    maxBooks: 1,
    duration: 30,
    popular: false,
    status: "active"
  },
  {
    title: "Standard Single", 
    price: 99,
    period: "/month",
    description: "Additional Limited Books Only",
    type: "single",
    features: [
      "Additional limited books",
      "Online reading only",
      "Priority customer support",
      "New releases included"
    ],
    maxBooks: 1,
    duration: 30,
    popular: true,
    status: "active"
  },
  {
    title: "Premium Single",
    price: 149,
    period: "/month", 
    description: "Any 1 Book - 1 Month Online Copy",
    type: "single",
    features: [
      "Any 1 book for 1 month",
      "Online reading only",
      "VIP customer support",
      "Flexible book selection"
    ],
    maxBooks: 1,
    duration: 30,
    popular: false,
    status: "active"
  },
  {
    title: "Lifetime Single",
    price: 999,
    period: "one-time",
    description: "For 5 years",
    type: "single",
    features: [
      "Access for 5 years",
      "Online reading only", 
      "All books included",
      "VIP customer support",
      "Exclusive lifetime member perks"
    ],
    maxBooks: 1,
    duration: 1825, // 5 years in days
    popular: false,
    status: "active"
  }
]

async function seedEbookPlans() {
  try {
    console.log('🌱 Seeding e-book plans...')
    
    // Validate Firebase configuration
    if (!firebaseConfig.projectId) {
      throw new Error('Firebase project ID is not configured. Please check your environment variables.')
    }
    
    console.log(`📁 Using Firebase project: ${firebaseConfig.projectId}`)
    
    for (const plan of ebookPlans) {
      try {
        // Validate plan data before adding
        if (!plan.title || !plan.price || !plan.type) {
          console.warn(`⚠️ Skipping plan with missing required fields: ${plan.title || 'Unknown'}`)
          continue
        }
        
        await addDoc(collection(db, 'ebookPlans'), {
          ...plan,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        console.log(`✅ Added e-book plan: ${plan.title}`)
      } catch (planError) {
        console.error(`❌ Failed to add plan "${plan.title}":`, planError.message)
        // Continue with other plans even if one fails
      }
    }
    
    console.log('🎉 E-book plans seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding e-book plans:', error.message)
    console.error('📋 Troubleshooting tips:')
    console.error('1. Check if Firebase environment variables are set correctly')
    console.error('2. Verify Firebase project exists and is accessible')
    console.error('3. Check Firebase security rules allow write access to "ebookPlans" collection')
    process.exit(1)
  }
}

seedEbookPlans()