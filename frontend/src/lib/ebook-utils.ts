import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  getDoc
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { EbookPlan, EbookSubscription, EbookOrder } from "@/types/ebook"

// PDF Upload
export const uploadBookPDF = async (file: File, bookId: string): Promise<string> => {
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error("PDF file size must be less than 10MB")
  }

  const timestamp = Date.now()
  const fileName = `${bookId}_${timestamp}.pdf`
  const storageRef = ref(storage, `ebooks/${fileName}`)

  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)

  return downloadURL
}

// Ebook Plans
export const addEbookPlan = async (planData: Omit<EbookPlan, 'id'>) => {
  return await addDoc(collection(db, "ebookPlans"), {
    ...planData,
    createdAt: serverTimestamp(),
  })
}

export const updateEbookPlan = async (id: string, planData: Partial<EbookPlan>) => {
  return await updateDoc(doc(db, "ebookPlans", id), {
    ...planData,
    updatedAt: serverTimestamp(),
  })
}

// Ebook Subscriptions
export const createEbookSubscription = async (subscriptionData: Omit<EbookSubscription, 'id'>) => {
  return await addDoc(collection(db, "ebookSubscriptions"), {
    ...subscriptionData,
    startDate: serverTimestamp(),
    endDate: new Date(Date.now() + subscriptionData.duration * 24 * 60 * 60 * 1000),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateEbookSubscription = async (id: string, updates: Partial<EbookSubscription>) => {
  return await updateDoc(doc(db, "ebookSubscriptions", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// Ebook Orders
export const createEbookOrder = async (orderData: Omit<EbookOrder, 'id'>) => {
  return await addDoc(collection(db, "ebookOrders"), {
    ...orderData,
    createdAt: serverTimestamp(),
  })
}

export const updateEbookOrder = async (id: string, updates: Partial<EbookOrder>) => {
  return await updateDoc(doc(db, "ebookOrders", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// PDF Upload
export const checkUserBookAccess = async (userId: string, bookId: string): Promise<boolean> => {
  try {
    // Get user's active subscriptions
    const subscriptionsQuery = query(
      collection(db, "ebookSubscriptions"),
      where("userId", "==", userId),
      where("status", "==", "active")
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    
    if (subscriptionsSnapshot.empty) {
      return false
    }

    // Check if user has access to this book through any subscription
    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      const subscription = subscriptionDoc.data()
      
      // Check if subscription is still valid (not expired)
      const endDate = subscription.endDate?.toDate()
      if (endDate && endDate < new Date()) {
        // Update subscription status to expired
        await updateDoc(subscriptionDoc.ref, {
          status: 'expired',
          updatedAt: serverTimestamp()
        })
        continue
      }

      // Premium and Lifetime plans have access to all books
      if (subscription.planType === 'multiple' && 
          (subscription.planTitle === 'Premium' || subscription.planTitle === 'Lifetime')) {
        return true
      }

      // Check if book is in selected books
      if (subscription.selectedBooks && subscription.selectedBooks.includes(bookId)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking book access:", error)
    return false
  }
}

// Get available books for plan selection
export const getBooksForPlanSelection = async (planId: string, planType: string) => {
  try {
    // Get all books with PDF and check visibility for this plan
    const booksQuery = query(collection(db, "books"))
    const booksSnapshot = await getDocs(booksQuery)
    
    const availableBooks = []
    
    for (const bookDoc of booksSnapshot.docs) {
      const bookData = bookDoc.data()
      
      // Only include books with PDF
      if (!bookData.pdfUrl) continue
      
      // Check visibility settings
      const visibility = bookData.ebookVisibility || {}
      
      if (planType === 'single' && visibility.singleEbooks) {
        availableBooks.push({ id: bookDoc.id, ...bookData })
      } else if (planType === 'multiple' && visibility.general) {
        availableBooks.push({ id: bookDoc.id, ...bookData })
      } else if (visibility.plans && visibility.plans.includes(planId)) {
        availableBooks.push({ id: bookDoc.id, ...bookData })
      }
    }
    
    return availableBooks
  } catch (error) {
    console.error("Error getting books for plan selection:", error)
    return []
  }
}

// Default ebook plans
export const defaultEbookPlans: Omit<EbookPlan, 'id'>[] = [
  {
    title: "Basic",
    price: 129,
    period: "/month",
    description: "3 Books per month",
    type: "multiple",
    features: ["3 Books per month", "Online reading only", "Multiple formats (PDF, EPUB)", "Customer support"],
    maxBooks: 3,
    duration: 30,
  },
  {
    title: "Standard",
    price: 299,
    period: "/month",
    description: "10 Books per month",
    type: "multiple",
    features: ["10 Books per month", "Online reading only", "Priority customer support", "New releases included"],
    maxBooks: 10,
    duration: 30,
    popular: true,
  },
  {
    title: "Premium",
    price: 499,
    period: "/month",
    description: "Unlimited Books per month",
    type: "multiple",
    features: ["Unlimited Books per month", "Online reading only", "VIP customer support", "Early access to new releases", "Exclusive content"],
    duration: 30,
  },
  {
    title: "Lifetime",
    price: 4999,
    period: "one-time",
    description: "Unlimited for 5 years",
    type: "multiple",
    features: ["Unlimited access for 5 years", "Online reading only", "All future releases included", "VIP customer support", "Exclusive lifetime member perks"],
    duration: 1825, // 5 years
  },
  {
    title: "Basic Single",
    price: 49,
    period: "/month",
    description: "Limited Collection Only",
    type: "single",
    features: ["Limited collection access", "Online reading only", "Multiple formats (PDF, EPUB)", "Customer support"],
    maxBooks: 1,
    duration: 30,
  },
  {
    title: "Standard Single",
    price: 99,
    period: "/month",
    description: "Additional Limited Books Only",
    type: "single",
    features: ["Additional limited books", "Online reading only", "Priority customer support", "New releases included"],
    maxBooks: 1,
    duration: 30,
  },
  {
    title: "Premium Single",
    price: 149,
    period: "/month",
    description: "Any 1 Book - 1 Month Online Copy",
    type: "single",
    features: ["Any 1 book for 1 month", "Online reading only", "VIP customer support", "Flexible book selection"],
    maxBooks: 1,
    duration: 30,
  },
  {
    title: "Lifetime Single",
    price: 999,
    period: "one-time",
    description: "For 5 years",
    type: "single",
    features: ["Access for 5 years", "Online reading only", "All books included", "VIP customer support", "Exclusive lifetime member perks"],
    maxBooks: 1,
    duration: 1825, // 5 years
  },
]