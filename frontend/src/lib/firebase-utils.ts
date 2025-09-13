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
  arrayUnion,
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
  oncePerUser?: boolean
  usedByUsers?: string[]
  isAffiliate?: boolean
  authorId?: string
  bookId?: string
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

// Hero Banners
export const addHeroBanner = async (bannerData: any) => {
  return await addDoc(collection(db, "heroBanners"), {
    ...bannerData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateHeroBanner = async (id: string, bannerData: any) => {
  return await updateDoc(doc(db, "heroBanners", id), {
    ...bannerData,
    updatedAt: serverTimestamp(),
  })
}

export const deleteHeroBanner = async (id: string) => {
  return await deleteDoc(doc(db, "heroBanners", id))
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

export const validateCoupon = async (code: string, orderValue: number, userId?: string) => {
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
  
  // Check if user has already used this coupon (for once per user coupons)
  if (coupon.oncePerUser && userId && coupon.usedByUsers && Array.isArray(coupon.usedByUsers) && coupon.usedByUsers.includes(userId)) {
    throw new Error("You have already used this coupon")
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

export const applyCoupon = async (couponId: string, userId?: string) => {
  try {
    // Validate inputs
    if (!couponId) {
      throw new Error('Coupon ID is required')
    }

    const updateData: any = {
      usedCount: increment(1),
      lastUsed: serverTimestamp(),
    }
    
    // If userId is provided, add to usedByUsers array for once per user tracking
    if (userId) {
      updateData.usedByUsers = arrayUnion(userId)
    }
    
    return await updateDoc(doc(db, "coupons", couponId), updateData)
  } catch (error) {
    console.error('Error applying coupon:', error)
    throw error
  }
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

export const processRefund = async (transactionId: string, amount: number, paymentMethod?: string) => {
  try {
    console.log('Processing refund for transaction:', transactionId, 'amount:', amount, 'method:', paymentMethod)
    
    // Try multiple approaches to find the transaction
    let transactionDoc = null
    let transactionData = null
    
    // First, try to find by gatewayTransactionId
    try {
      const transactionsRef = collection(db, "transactions")
      const q1 = query(transactionsRef, where("gatewayTransactionId", "==", transactionId))
      const querySnapshot1 = await getDocs(q1)
      
      if (!querySnapshot1.empty) {
        transactionDoc = querySnapshot1.docs[0]
        transactionData = transactionDoc.data()
        console.log('Found transaction by gatewayTransactionId:', transactionData)
      }
    } catch (error) {
      console.warn('Error querying by gatewayTransactionId:', error)
    }
    
    // If not found, try to find by transactionId field
    if (!transactionDoc) {
      try {
        const transactionsRef = collection(db, "transactions")
        const q2 = query(transactionsRef, where("transactionId", "==", transactionId))
        const querySnapshot2 = await getDocs(q2)
        
        if (!querySnapshot2.empty) {
          transactionDoc = querySnapshot2.docs[0]
          transactionData = transactionDoc.data()
          console.log('Found transaction by transactionId:', transactionData)
        }
      } catch (error) {
        console.warn('Error querying by transactionId:', error)
      }
    }
    
    // If still not found, try to find by document ID
    if (!transactionDoc) {
      try {
        const docRef = doc(db, "transactions", transactionId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          transactionDoc = docSnap
          transactionData = docSnap.data()
          console.log('Found transaction by document ID:', transactionData)
        }
      } catch (error) {
        console.warn('Error querying by document ID:', error)
      }
    }
    
    if (!transactionDoc || !transactionData) {
      console.error('Transaction not found with ID:', transactionId)
      throw new Error(`Transaction with ID ${transactionId} not found in database`)
    }
    
    // Determine the actual gateway transaction ID to use for refund
    const gatewayTxnId = transactionData.gatewayTransactionId || 
                        transactionData.transactionId || 
                        transactionId
    
    // Determine payment method
    const refundPaymentMethod = transactionData.paymentMethod || paymentMethod || 'razorpay'
    
    console.log('Processing refund with gateway ID:', gatewayTxnId, 'method:', refundPaymentMethod)
    
    // Call backend API to process refund based on payment method
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL
    if (!backendUrl) {
      throw new Error('Backend API URL not configured')
    }

    const response = await fetch(`${backendUrl}/api/payment/process-refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: gatewayTxnId,
        amount: transactionData.amount || amount,
        refundAmount: amount,
        paymentMethod: refundPaymentMethod,
        reason: 'Admin initiated refund'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Failed to process refund'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        errorMessage = errorText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    const refundResult = await response.json()
    
    console.log('Refund API response:', refundResult)
    
    // Handle different response structures
    const refundData = refundResult.data || refundResult
    
    if (!refundData.success && refundResult.success !== true) {
      throw new Error(refundData.message || 'Refund processing failed')
    }
    
    // Prepare update data with validation
    const updateData: any = {
      status: "refunded",
      refundAmount: amount,
      refundedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      refundReason: 'Admin initiated refund',
      refundMethod: refundPaymentMethod
    }
    
    // Add refund details if available
    if (refundData.refundId || refundData.id) {
      updateData.refundId = refundData.refundId || refundData.id
    }
    
    if (refundData.status || refundData.refundStatus) {
      updateData.refundStatus = refundData.status || refundData.refundStatus
    }
    
    console.log('Updating transaction with data:', updateData)
    
    // Update transaction status in Firestore
    await updateDoc(transactionDoc.ref, updateData)
    
    console.log('Transaction updated successfully in Firestore')
    
    return {
      success: true,
      refundId: refundData.refundId || refundData.id,
      refundAmount: amount,
      status: refundData.status || 'processed',
      message: refundData.message || 'Refund processed successfully'
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      throw new Error(`Refund failed: ${error.message}`)
    } else {
      throw new Error('Refund processing failed due to an unknown error')
    }
  }
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

// Enhanced delete function that removes book, author data, and author access
export const deleteBookAndAuthorData = async (bookId: string) => {
  try {
    // First, get the book details to find the author
    const bookDoc = await getDoc(doc(db, "books", bookId))
    if (!bookDoc.exists()) {
      throw new Error('Book not found')
    }
    
    const bookData = bookDoc.data()
    const authorEmail = bookData.authorEmail
    const authorId = bookData.authorId
    const bookTitle = bookData.title
    
    console.log('Deleting book and ALL related data:', { bookId, authorEmail, authorId, bookTitle })
    
    // 1. Delete the book from books collection
    await deleteDoc(doc(db, "books", bookId))
    console.log('✓ Book deleted from books collection')
    
    
    // 3. Delete related orders that contain this book
    const ordersQuery = query(collection(db, "orders"))
    const ordersSnapshot = await getDocs(ordersQuery)
    const orderDeletes = []
    
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data()
      if (orderData.items && Array.isArray(orderData.items)) {
        const hasBook = orderData.items.some((item: any) => item.bookId === bookId)
        if (hasBook) {
          orderDeletes.push(deleteDoc(orderDoc.ref))
        }
      }
    }
    
    if (orderDeletes.length > 0) {
      await Promise.all(orderDeletes)
      console.log(`✓ Deleted ${orderDeletes.length} orders containing this book`)
    }
    
    // 4. Delete reviews for this book
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("bookId", "==", bookId)
    )
    const reviewsSnapshot = await getDocs(reviewsQuery)
    const reviewDeletes = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(reviewDeletes)
    console.log(`✓ Deleted ${reviewsSnapshot.docs.length} reviews`)
    
    // 5. Delete affiliate links for this book
    const affiliateLinksQuery = query(
      collection(db, "affiliateLinks"),
      where("bookId", "==", bookId)
    )
    const affiliateLinksSnapshot = await getDocs(affiliateLinksQuery)
    const affiliateLinkDeletes = affiliateLinksSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(affiliateLinkDeletes)
    console.log(`✓ Deleted ${affiliateLinksSnapshot.docs.length} affiliate links`)
    
    // 6. Delete coupons associated with this book
    const couponsQuery = query(
      collection(db, "coupons"),
      where("bookId", "==", bookId)
    )
    const couponsSnapshot = await getDocs(couponsQuery)
    const couponDeletes = couponsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(couponDeletes)
    console.log(`✓ Deleted ${couponsSnapshot.docs.length} coupons`)
    
    // 7. Delete transactions related to this book
    const transactionsQuery = query(collection(db, "transactions"))
    const transactionsSnapshot = await getDocs(transactionsQuery)
    const transactionDeletes = []
    
    for (const transactionDoc of transactionsSnapshot.docs) {
      const transactionData = transactionDoc.data()
      if (transactionData.bookId === bookId || 
          (transactionData.orderId && orderDeletes.some((_, index) => 
            ordersSnapshot.docs[index]?.id === transactionData.orderId
          ))) {
        transactionDeletes.push(deleteDoc(transactionDoc.ref))
      }
    }
    
    if (transactionDeletes.length > 0) {
      await Promise.all(transactionDeletes)
      console.log(`✓ Deleted ${transactionDeletes.length} transactions related to this book`)
    }
    
    // 8. Delete author books for THIS SPECIFIC BOOK only (not all author books)
    let authorBooksDeleted = 0
    if (authorId) {
      // Find the specific author book that corresponds to this published book
      const authorBooksQuery = query(
        collection(db, "authorBooks"),
        where("assignedBookId", "==", bookId)
      )
      const authorBooksSnapshot = await getDocs(authorBooksQuery)
      const authorBookDeletes = authorBooksSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(authorBookDeletes)
      authorBooksDeleted = authorBooksSnapshot.docs.length
      console.log(`✓ Deleted ${authorBooksDeleted} author book entries for this specific book`)
      
      // Check if author has any other books in the main books collection
      const otherBooksQuery = query(
        collection(db, "books"),
        where("authorId", "==", authorId)
      )
      const otherBooksSnapshot = await getDocs(otherBooksQuery)
      
      // If this was the author's only book, revoke their author access
      if (otherBooksSnapshot.empty) {
        console.log('✓ This was the author\'s only book, revoking author access')
        
        // Update author status in authors collection
        const authorsQuery = query(collection(db, "authors"), where("uid", "==", authorId))
        const authorsSnapshot = await getDocs(authorsQuery)
        
        if (!authorsSnapshot.empty) {
          const authorDoc = authorsSnapshot.docs[0]
          await updateDoc(doc(db, "authors", authorDoc.id), {
            status: 'revoked',
            revokedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          console.log('✓ Author status updated to revoked')
        }
        
        // Update user role in users collection
        const usersQuery = query(collection(db, "users"), where("uid", "==", authorId))
        const usersSnapshot = await getDocs(usersQuery)
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0]
          await updateDoc(doc(db, "users", userDoc.id), {
            role: 'customer',
            updatedAt: serverTimestamp()
          })
          console.log('✓ User role changed to customer')
        }
        
        // Update user profile in userProfiles collection
        const userProfileDoc = await getDoc(doc(db, "userProfiles", authorId))
        if (userProfileDoc.exists()) {
          await updateDoc(doc(db, "userProfiles", authorId), {
            role: 'customer',
            updatedAt: serverTimestamp()
          })
          console.log('✓ User profile role updated to customer')
        } else {
          // Create customer profile if it doesn't exist
          const authorData = authorsSnapshot.docs[0]?.data()
          await setDoc(doc(db, "userProfiles", authorId), {
            id: authorId,
            email: authorEmail,
            displayName: authorData?.name || '',
            firstName: authorData?.name?.split(' ')[0] || '',
            lastName: authorData?.name?.split(' ').slice(1).join(' ') || '',
            phone: authorData?.mobile || '',
            role: 'customer',
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
          console.log('✓ Created customer profile for former author')
        }
        
        // Send notification email to author about access revocation
        try {
          const { sendAuthorNotification } = await import('./author-utils')
          await sendAuthorNotification(
            authorEmail,
            'access_revoked',
            bookTitle,
            { reason: 'Book deleted' }
          )
          console.log('✓ Sent access revocation email to author')
        } catch (emailError) {
          console.error('Failed to send access revocation email:', emailError)
          // Don't throw error as the main operation was successful
        }
      } else {
        console.log('✓ Author has other books, keeping author access')
        
        // Send notification to author about this specific book deletion
        if (authorEmail) {
          try {
            const { sendAuthorNotification } = await import('./author-utils')
            await sendAuthorNotification(
              authorEmail,
              'book_deleted',
              bookTitle,
              { reason: 'Book removed from catalog' }
            )
            console.log('✓ Sent book deletion notification to author')
          } catch (emailError) {
            console.error('Failed to send book deletion notification:', emailError)
          }
        }
      }
    }
    
    // 9. Delete any wishlist entries for this book
    const userProfilesQuery = query(collection(db, "userProfiles"))
    const userProfilesSnapshot = await getDocs(userProfilesQuery)
    const wishlistUpdates = []
    
    for (const profileDoc of userProfilesSnapshot.docs) {
      const profileData = profileDoc.data()
      if (profileData.wishlist && Array.isArray(profileData.wishlist)) {
        const updatedWishlist = profileData.wishlist.filter((item: any) => item.bookId !== bookId)
        if (updatedWishlist.length !== profileData.wishlist.length) {
          wishlistUpdates.push(
            updateDoc(doc(db, "userProfiles", profileDoc.id), {
              wishlist: updatedWishlist,
              updatedAt: serverTimestamp()
            })
          )
        }
      }
    }
    
    if (wishlistUpdates.length > 0) {
      await Promise.all(wishlistUpdates)
      console.log(`✓ Removed book from ${wishlistUpdates.length} user wishlists`)
    }
    
    // 10. Delete any cart items for this book
    const cartUpdates = []
    for (const profileDoc of userProfilesSnapshot.docs) {
      const profileData = profileDoc.data()
      if (profileData.cart && Array.isArray(profileData.cart)) {
        const updatedCart = profileData.cart.filter((item: any) => item.bookId !== bookId)
        if (updatedCart.length !== profileData.cart.length) {
          cartUpdates.push(
            updateDoc(doc(db, "userProfiles", profileDoc.id), {
              cart: updatedCart,
              updatedAt: serverTimestamp()
            })
          )
        }
      }
    }
    
    if (cartUpdates.length > 0) {
      await Promise.all(cartUpdates)
      console.log(`✓ Removed book from ${cartUpdates.length} user carts`)
    }
    
    console.log('✓ COMPLETE: Book and ALL related data deletion completed successfully')
    
    return {
      success: true,
      bookId,
      bookTitle,
      authorEmail,
      authorId,
      deletedItems: {
        book: 1,
        orders: orderDeletes.length,
        reviews: reviewsSnapshot.docs.length,
        affiliateLinks: affiliateLinksSnapshot.docs.length,
        coupons: couponsSnapshot.docs.length,
        transactions: transactionDeletes.length,
        authorBooks: authorBooksDeleted,
        wishlistUpdates: wishlistUpdates.length,
        cartUpdates: cartUpdates.length
      }
    }
    
  } catch (error) {
    console.error('Error deleting book and author data:', error)
    throw error
  }
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

export const checkSubscriberStatus = async (email: string) => {
  const q = query(collection(db, "subscribers"), where("email", "==", email))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    return null
  }
  
  const subscriber = querySnapshot.docs[0]
  return {
    id: subscriber.id,
    ...subscriber.data()
  }
}

export const unsubscribeFromNewsletter = async (email: string) => {
  const subscriber = await checkSubscriberStatus(email)
  
  if (!subscriber) {
    throw new Error("Email not found in subscribers list")
  }
  
  return await updateSubscriberStatus(subscriber.id, "unsubscribed")
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
    // Check if user profile already exists with this email
    const existingProfileQuery = query(
      collection(db, "userProfiles"),
      where("email", "==", userData.email)
    )
    const existingProfileSnapshot = await getDocs(existingProfileQuery)
    
    if (!existingProfileSnapshot.empty) {
      throw new Error('A user profile with this email already exists. Please use a different email.')
    }

    // Additional validation: Check if user already exists in users collection
    const existingUserQuery = query(
      collection(db, "users"),
      where("email", "==", userData.email)
    )
    const existingUserSnapshot = await getDocs(existingUserQuery)
    
    if (!existingUserSnapshot.empty) {
      throw new Error('A user with this email already exists. Please use a different email.')
    }

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
      throw new Error('This email address is already registered. Please use a different email or try logging in.')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak (mobile number should be at least 6 characters)')
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password accounts are not enabled. Please contact support.')
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.')
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

// Zoho Configuration
export const getZohoCredentials = async () => {
  try {
    const credDoc = await getDoc(doc(db, 'zohoapi', 'ZOHO_CRED'))
    if (!credDoc.exists()) {
      throw new Error('Zoho credentials not found in Firestore')
    }
    return credDoc.data()
  } catch (error) {
    console.error('Error fetching Zoho credentials:', error)
    throw new Error('Failed to fetch Zoho credentials')
  }
}

export const updateZohoCredentials = async (credentials: any) => {
  try {
    await setDoc(doc(db, 'zohoapi', 'ZOHO_CRED'), credentials, { merge: true })
    console.log('Zoho credentials updated successfully')
  } catch (error) {
    console.error('Error updating Zoho credentials:', error)
    throw new Error('Failed to update Zoho credentials')
  }
}
