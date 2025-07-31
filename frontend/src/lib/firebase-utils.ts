import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  where,
  getCountFromServer,
  increment,
  setDoc,
  getDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, storage, auth } from "@/lib/firebase"
import { sendWelcomeEmail } from "./email-utils"

interface Coupon {
  id: string
  code: string
  status: string
  expiryDate?: any
  usageLimit?: number
  usedCount?: number
  minOrderValue?: number
  discountType: string
  discountValue: number
  maxDiscountAmount?: number
}

// Shipping Methods
export const addShippingMethod = async (methodData: any) => {
  return await addDoc(collection(db, "shippingMethods"), {
    ...methodData,
    createdAt: serverTimestamp(),
  })
}

export const updateShippingMethod = async (id: string, methodData: any) => {
  return await updateDoc(doc(db, "shippingMethods", id), {
    ...methodData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteShippingMethod = async (id: string) => {
  return await deleteDoc(doc(db, "shippingMethods", id))
}

// Coupons
export const addCoupon = async (couponData: any) => {
  return await addDoc(collection(db, "coupons"), {
    ...couponData,
    usedCount: 0,
    createdAt: serverTimestamp(),
  })
}

export const updateCoupon = async (id: string, couponData: any) => {
  return await updateDoc(doc(db, "coupons", id), {
    ...couponData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteCoupon = async (id: string) => {
  return await deleteDoc(doc(db, "coupons", id))
}

export const validateCoupon = async (code: string, orderValue: number) => {
  const q = query(collection(db, "coupons"), where("code", "==", code.toUpperCase()))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    throw new Error("Invalid coupon code")
  }
  
  const couponDoc = querySnapshot.docs[0]
  const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon
  
  // Validate coupon
  if (coupon.status !== "active") {
    throw new Error("Coupon is not active")
  }
  
  if (coupon.expiryDate && coupon.expiryDate.toDate() < new Date()) {
    throw new Error("Coupon has expired")
  }
  
  if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached")
  }
  
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
    throw new Error(`Minimum order value of ₹${coupon.minOrderValue} required`)
  }
  
  // Calculate discount
  let discountAmount = 0
  if (coupon.discountType === "percentage") {
    discountAmount = (orderValue * coupon.discountValue) / 100
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount
    }
  } else {
    discountAmount = coupon.discountValue
  }
  
  return {
    coupon,
    discountAmount: Math.round(discountAmount)
  }
}

export const applyCoupon = async (couponId: string) => {
  return await updateDoc(doc(db, "coupons", couponId), {
    usedCount: increment(1),
    lastUsed: serverTimestamp(),
  })
}

// Orders
export const updateOrderStatus = async (orderId: string, status: string, additionalData?: any) => {
  try {
    // First, get the current order to check its previous status and total
    const orderDoc = await getDoc(doc(db, "orders", orderId))
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }
    
    const order = orderDoc.data()
    const previousStatus = order.status
    const orderTotal = order.total || 0
    
    // Update the order
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData
    }
    
    await updateDoc(doc(db, "orders", orderId), updateData)
    
    // Update customer profile based on status change
    if (order.userEmail) {
      try {
        // Find customer by email
        const customerQuery = query(
          collection(db, "userProfiles"), 
          where("email", "==", order.userEmail)
        )
        const customerSnapshot = await getDocs(customerQuery)
        
        if (!customerSnapshot.empty) {
          const customerDoc = customerSnapshot.docs[0]
          // const customerData = customerDoc.data()
          
          let orderCountChange = 0
          let totalSpentChange = 0
          
          // Handle status changes
          if (status === "cancelled" && previousStatus !== "cancelled") {
            // Order was cancelled - decrease totals
            orderCountChange = -1
            totalSpentChange = -orderTotal
          } else if (previousStatus === "cancelled" && status !== "cancelled") {
            // Order was uncancelled - increase totals
            orderCountChange = 1
            totalSpentChange = orderTotal
          }
          // For other status changes, we don't modify the totals since the order was already counted
          
          if (orderCountChange !== 0 || totalSpentChange !== 0) {
            await updateDoc(doc(db, "userProfiles", customerDoc.id), {
              orderCount: increment(orderCountChange),
              totalSpent: increment(totalSpentChange),
              updatedAt: serverTimestamp()
            })
          }
        }
      } catch (error) {
        console.warn("Failed to update customer profile for order status change:", error)
        // Don't throw error as the order update was successful
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

// Delete order
export const deleteOrder = async (orderId: string) => {
  try {
    // First, get the order to check its status and total
    const orderDoc = await getDoc(doc(db, "orders", orderId))
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }
    
    const order = orderDoc.data()
    const orderTotal = order.total || 0
    
    // Delete the order
    await deleteDoc(doc(db, "orders", orderId))
    
    // Update customer profile if order was not cancelled (cancelled orders don't affect totals)
    if (order.userEmail && order.status !== "cancelled") {
      try {
        // Find customer by email
        const customerQuery = query(
          collection(db, "userProfiles"), 
          where("email", "==", order.userEmail)
        )
        const customerSnapshot = await getDocs(customerQuery)
        
        if (!customerSnapshot.empty) {
          const customerDoc = customerSnapshot.docs[0]
          
          // Decrease order count and total spent
          await updateDoc(doc(db, "userProfiles", customerDoc.id), {
            orderCount: increment(-1),
            totalSpent: increment(-orderTotal),
            updatedAt: serverTimestamp()
          })
        }
      } catch (error) {
        console.warn("Failed to update customer profile for order deletion:", error)
        // Don't throw error as the order deletion was successful
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}
// Transactions
export const addTransaction = async (transactionData: any) => {
  return await addDoc(collection(db, "transactions"), {
    ...transactionData,
    createdAt: serverTimestamp(),
  })
}

export const updateTransaction = async (id: string, transactionData: any) => {
  return await updateDoc(doc(db, "transactions", id), {
    ...transactionData,
    updatedAt: serverTimestamp(),
  })
}

export const processRefund = async (transactionId: string, amount: number) => {
  // Update transaction status
  await updateDoc(doc(db, "transactions", transactionId), {
    status: "refunded",
    refundAmount: amount,
    refundedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  
  // In a real implementation, you would also call the payment gateway's refund API
  return { success: true, refundAmount: amount }
}

// Testimonials
export const addTestimonial = async (testimonialData: any) => {
  return await addDoc(collection(db, "testimonials"), {
    ...testimonialData,
    createdAt: serverTimestamp(),
  })
}

export const updateTestimonial = async (id: string, testimonialData: any) => {
  return await updateDoc(doc(db, "testimonials", id), {
    ...testimonialData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteTestimonial = async (id: string) => {
  return await deleteDoc(doc(db, "testimonials", id))
}

// Books
export const addBook = async (bookData: any) => {
  return await addDoc(collection(db, "books"), {
    ...bookData,
    createdAt: serverTimestamp(),
  })
}

export const updateBook = async (id: string, bookData: any) => {
  return await updateDoc(doc(db, "books", id), {
    ...bookData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteBook = async (id: string) => {
  return await deleteDoc(doc(db, "books", id))
}

// Featured Books
export const toggleFeaturedBook = async (id: string, isFeatured: boolean) => {
  return await updateDoc(doc(db, "books", id), {
    isFeatured,
    updatedAt: serverTimestamp(),
  })
}

export const getFeaturedBooksCount = async (): Promise<number> => {
  const q = query(collection(db, "books"), where("isFeatured", "==", true))
  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

// Team
export const addTeamMember = async (teamData: any) => {
  return await addDoc(collection(db, "team"), {
    ...teamData,
    createdAt: serverTimestamp(),
  })
}

export const updateTeamMember = async (id: string, teamData: any) => {
  return await updateDoc(doc(db, "team", id), {
    ...teamData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteTeamMember = async (id: string) => {
  return await deleteDoc(doc(db, "team", id))
}

// Updates
export const addUpdate = async (updateData: any) => {
  return await addDoc(collection(db, "updates"), {
    ...updateData,
    isActive: updateData.status === "active",
    createdAt: serverTimestamp(),
  })
}

export const updateUpdate = async (id: string, updateData: any) => {
  return await updateDoc(doc(db, "updates", id), {
    ...updateData,
    isActive: updateData.status === "active",
    updatedAt: serverTimestamp(),
  })
}

export const deleteUpdate = async (id: string) => {
  return await deleteDoc(doc(db, "updates", id))
}

// Contact Messages
export const submitContactForm = async (formData: any) => {
  return await addDoc(collection(db, "messages"), {
    ...formData,
    status: "unread",
    createdAt: serverTimestamp(),
  })
}

export const updateMessageStatus = async (id: string, status: string) => {
  return await updateDoc(doc(db, "messages", id), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export const deleteMessage = async (id: string) => {
  return await deleteDoc(doc(db, "messages", id))
}

// Newsletter Subscriptions
export const subscribeToNewsletter = async (email: string) => {
  // Check if email already exists
  const q = query(collection(db, "subscribers"), where("email", "==", email))
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
    throw new Error("Email already subscribed")
  }

  return await addDoc(collection(db, "subscribers"), {
    email,
    status: "active",
    createdAt: serverTimestamp(),
  })
}

export const updateSubscriberStatus = async (id: string, status: string) => {
  return await updateDoc(doc(db, "subscribers", id), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export const deleteSubscriber = async (id: string) => {
  return await deleteDoc(doc(db, "subscribers", id))
}

// File Upload
export const uploadImage = async (file: File, folder: string): Promise<string> => {
  const timestamp = Date.now()
  const fileName = `${timestamp}_${file.name}`
  const storageRef = ref(storage, `${folder}/${fileName}`)

  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)

  return downloadURL
}

// Users
export const addUser = async (userData: any) => {
  try {
    // First, create user in Firebase Authentication
    const authUser = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.mobile // Using mobile number as password
    )

    // Then, add user to Firestore with the auth UID
    const firestoreUser = await addDoc(collection(db, "users"), {
      ...userData,
      uid: authUser.user.uid, // Link to Firebase Auth user
      createdAt: serverTimestamp(),
    })

    // Only create user profile in userProfiles collection for non-admin users
    // Admin users should only exist in the users collection
    if (userData.role !== 'admin') {
      await setDoc(doc(db, "userProfiles", authUser.user.uid), {
        id: authUser.user.uid,
        email: userData.email,
        displayName: userData.name,
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
        phone: userData.mobile,
        role: userData.role, // This will be 'editor' or other non-admin roles
        addresses: [],
        preferences: {
          newsletter: true,
          notifications: true,
          language: 'en'
        },
        orderHistory: [],
        wishlist: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    // Send welcome email
    try {
      await sendWelcomeEmail({
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        role: userData.role,
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't throw error here as user was created successfully
    }

    return firestoreUser
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('A user with this email already exists')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak (mobile number should be at least 6 characters)')
    } else {
      throw new Error('Failed to create user. Please try again.')
    }
  }
}

export const updateUser = async (id: string, userData: any) => {
  // Update in users collection
  await updateDoc(doc(db, "users", id), {
    ...userData,
    updatedAt: serverTimestamp(),
  })

  // Only update userProfiles collection for non-admin users
  // Admin users should not be updated in userProfiles collection at all
  try {
    const userDoc = await getDoc(doc(db, "users", id))
    if (userDoc.exists()) {
      const user = userDoc.data()
      // Only update userProfiles if the user is not an admin
      if (user.uid && user.role !== 'admin' && userData.role !== 'admin') {
        await updateDoc(doc(db, "userProfiles", user.uid), {
          displayName: userData.name,
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          phone: userData.mobile,
          role: userData.role,
          updatedAt: serverTimestamp(),
        })
      }
    }
  } catch (error) {
    console.warn('Failed to update userProfiles collection:', error)
    // Don't throw error as the main update was successful
  }
}

export const deleteUser = async (id: string) => {
  return await deleteDoc(doc(db, "users", id))
}

// Inventory Management
export const updateBookStock = async (bookId: string, quantity: number) => {
  return await updateDoc(doc(db, "books", bookId), {
    stock: increment(-quantity),
    updatedAt: serverTimestamp(),
  })
}

export const addBookStock = async (bookId: string, quantity: number) => {
  return await updateDoc(doc(db, "books", bookId), {
    stock: increment(quantity),
    updatedAt: serverTimestamp(),
  })
}

export const checkBookAvailability = async (bookId: string, requestedQuantity: number) => {
  const bookDoc = await getDocs(query(collection(db, "books"), where("__name__", "==", bookId)))
  if (!bookDoc.empty) {
    const book = bookDoc.docs[0].data()
    return (book.stock || 0) >= requestedQuantity
  }
  return false
}

// Reviews
export const addReview = async (reviewData: any) => {
  return await addDoc(collection(db, "reviews"), {
    ...reviewData,
    status: reviewData.status || 'pending',
    helpful: 0,
    createdAt: serverTimestamp(),
  })
}

export const updateReview = async (id: string, reviewData: any) => {
  return await updateDoc(doc(db, "reviews", id), {
    ...reviewData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteReview = async (id: string) => {
  return await deleteDoc(doc(db, "reviews", id))
}

export const approveReview = async (id: string) => {
  return await updateDoc(doc(db, "reviews", id), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  })
}

export const rejectReview = async (id: string) => {
  return await updateDoc(doc(db, "reviews", id), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  })
}

// Recalculate customer order counts and totals from existing orders
export const recalculateCustomerStats = async () => {
  try {
    // Get all orders
    const ordersQuery = query(collection(db, "orders"))
    const ordersSnapshot = await getDocs(ordersQuery)
    
    // Group orders by customer email
    const customerStats: { [email: string]: { orderCount: number; totalSpent: number } } = {}
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data()
      const email = order.userEmail
      
      if (email && order.status !== "cancelled") {
        if (!customerStats[email]) {
          customerStats[email] = { orderCount: 0, totalSpent: 0 }
        }
        customerStats[email].orderCount += 1
        customerStats[email].totalSpent += order.total || 0
      }
    })
    
    // Update all customer profiles
    const customersQuery = query(collection(db, "userProfiles"))
    const customersSnapshot = await getDocs(customersQuery)
    
    const updatePromises = customersSnapshot.docs.map(async (doc) => {
      const customer = doc.data()
      const email = customer.email
      
      if (email && customerStats[email]) {
        return updateDoc(doc.ref, {
          orderCount: customerStats[email].orderCount,
          totalSpent: customerStats[email].totalSpent,
          updatedAt: serverTimestamp()
        })
      } else if (email) {
        // Customer has no orders, reset to 0
        return updateDoc(doc.ref, {
          orderCount: 0,
          totalSpent: 0,
          updatedAt: serverTimestamp()
        })
      }
    })
    
    await Promise.all(updatePromises.filter(Boolean))
    
    return { success: true, customersUpdated: customersSnapshot.docs.length }
  } catch (error) {
    console.error("Error recalculating customer stats:", error)
    throw error
  }
}
