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
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, storage, auth } from "@/lib/firebase"
import { sendWelcomeEmail } from "./email-utils"

// Upload author files
export const uploadAuthorFile = async (file: File, folder: string, authorId: string): Promise<string> => {
  const timestamp = Date.now()
  const fileName = `${authorId}_${timestamp}_${file.name}`
  const storageRef = ref(storage, `authors/${folder}/${fileName}`)

  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)

  return downloadURL
}

// Create author account
export const createAuthorAccount = async (authorData: any) => {
  try {
    // Create user in Firebase Authentication
    const authUser = await createUserWithEmailAndPassword(
      auth,
      authorData.email,
      authorData.mobile // Using mobile as password
    )

    // Create author profile in Firestore
    const authorRef = await addDoc(collection(db, "authors"), {
      ...authorData,
      uid: authUser.user.uid,
      role: 'author',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create user profile for authentication
    await addDoc(collection(db, "users"), {
      name: authorData.name,
      email: authorData.email,
      mobile: authorData.mobile,
      role: 'author',
      uid: authUser.user.uid,
      createdAt: serverTimestamp(),
    })

    // Send welcome email
    try {
      await sendWelcomeEmail({
        name: authorData.name,
        email: authorData.email,
        mobile: authorData.mobile,
        role: 'author',
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    return { authorRef, authUser }
  } catch (error) {
    console.error('Error creating author account:', error)
    throw error
  }
}

// Submit author book
export const submitAuthorBook = async (bookData: any, authorId: string) => {
  return await addDoc(collection(db, "authorBooks"), {
    ...bookData,
    authorId,
    stage: 'review',
    paymentStatus: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

// Update author book stage
export const updateAuthorBookStage = async (bookId: string, stage: string, additionalData?: any) => {
  return await updateDoc(doc(db, "authorBooks", bookId), {
    stage,
    ...additionalData,
    updatedAt: serverTimestamp()
  })
}

// Get author sales report
export const getAuthorSalesReport = async (authorId: string, bookId?: string) => {
  try {
    // Get orders that contain the author's books
    const ordersQuery = query(collection(db, "orders"))
    const ordersSnapshot = await getDocs(ordersQuery)
    
    const salesData: any = {}
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data()
      
      if (order.items && order.status === 'delivered') {
        for (const item of order.items) {
          // Check if this item belongs to the author
          if (bookId && item.bookId !== bookId) continue
          
          const bookDoc = await getDoc(doc(db, "books", item.bookId))
          if (bookDoc.exists()) {
            const book = bookDoc.data()
            if (book.authorId === authorId) {
              const orderDate = order.createdAt?.toDate()
              if (orderDate) {
                const month = orderDate.getMonth() + 1
                const year = orderDate.getFullYear()
                const key = `${year}-${month}-${item.bookId}`
                
                if (!salesData[key]) {
                  salesData[key] = {
                    bookId: item.bookId,
                    bookTitle: item.title,
                    month,
                    year,
                    totalSales: 0,
                    totalRevenue: 0,
                    affiliateSales: 0,
                    affiliateRevenue: 0
                  }
                }
                
                salesData[key].totalSales += item.quantity
                salesData[key].totalRevenue += item.price * item.quantity
                
                // Check if this was an affiliate sale
                if (order.affiliateCode) {
                  salesData[key].affiliateSales += item.quantity
                  salesData[key].affiliateRevenue += item.price * item.quantity
                }
              }
            }
          }
        }
      }
    }
    
    return Object.values(salesData)
  } catch (error) {
    console.error('Error getting sales report:', error)
    throw error
  }
}

// Create affiliate link
export const createAffiliateLink = async (authorId: string, bookId: string) => {
  try {
    // Generate unique link code
    const linkCode = `AFF_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    // Generate coupon code
    const couponCode = `AUTHOR${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Create coupon first
    await addDoc(collection(db, "coupons"), {
      code: couponCode,
      description: `Author affiliate discount for book`,
      discountType: "percentage",
      discountValue: 10, // 10% discount
      minOrderValue: 0,
      maxDiscountAmount: 500,
      usageLimit: 0, // Unlimited
      status: "active",
      oncePerUser: false,
      usedCount: 0,
      usedByUsers: [],
      isAffiliate: true,
      authorId,
      bookId,
      createdAt: serverTimestamp()
    })
    
    // Create affiliate link
    const affiliateRef = await addDoc(collection(db, "affiliateLinks"), {
      authorId,
      bookId,
      couponCode,
      linkCode,
      url: `${window.location.origin}/book/${bookId}?ref=${linkCode}&coupon=${couponCode}`,
      isActive: true,
      totalClicks: 0,
      totalSales: 0,
      totalRevenue: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return affiliateRef
  } catch (error) {
    console.error('Error creating affiliate link:', error)
    throw error
  }
}

// Send author notification emails
export const sendAuthorNotification = async (authorEmail: string, stage: string, bookTitle: string, additionalData?: any) => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL
    if (!backendUrl) {
      console.warn('Backend URL not configured for email notifications')
      return
    }

    const response = await fetch(`${backendUrl}/api/authors/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorEmail,
        stage,
        bookTitle,
        additionalData
      }),
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send notification')
    }

    console.log('Author notification sent successfully:', result.messageId)
    return result
    
  } catch (error) {
    console.error('Error sending author notification:', error)
    throw error
  }
}