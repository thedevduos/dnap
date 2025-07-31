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
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, storage, auth } from "@/lib/firebase"
import { sendWelcomeEmail } from "./email-utils"

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
  const coupon = { id: couponDoc.id, ...couponDoc.data() }
  
  // Validate coupon
  if (coupon.status !== "active") {
    throw new Error("Coupon is not active")
  }
  
  if (coupon.expiryDate && coupon.expiryDate.toDate() < new Date()) {
    throw new Error("Coupon has expired")
  }
  
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
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
  const updateData = {
    status,
    updatedAt: serverTimestamp(),
    ...additionalData
  }
  
  return await updateDoc(doc(db, "orders", orderId), updateData)
}

// Delete order
export const deleteOrder = async (orderId: string) => {
  return await deleteDoc(doc(db, "orders", orderId))
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
  return await updateDoc(doc(db, "users", id), {
    ...userData,
    updatedAt: serverTimestamp(),
  })
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
