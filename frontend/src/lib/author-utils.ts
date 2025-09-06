import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  getDocs,
  getDoc,
  deleteDoc,
  where,
  setDoc,
  increment,
  writeBatch
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
    // Check if user profile already exists with this email
    const existingProfileQuery = query(
      collection(db, "userProfiles"),
      where("email", "==", authorData.email)
    )
    const existingProfileSnapshot = await getDocs(existingProfileQuery)
    
    if (!existingProfileSnapshot.empty) {
      throw new Error('A user profile with this email already exists. Please use a different email.')
    }

    // Additional validation: Check if user already exists in users collection
    const existingUserQuery = query(
      collection(db, "users"),
      where("email", "==", authorData.email)
    )
    const existingUserSnapshot = await getDocs(existingUserQuery)
    
    if (!existingUserSnapshot.empty) {
      throw new Error('A user with this email already exists. Please use a different email or try logging in.')
    }

    // Create user in Firebase Authentication
    const authUser = await createUserWithEmailAndPassword(
      auth,
      authorData.email,
      authorData.mobile // Using mobile as password
    )

    // Use transaction to ensure atomicity of database operations
    const batch = writeBatch(db)
    
    // Create author profile in Firestore
    const authorRef = doc(collection(db, "authors"))
    batch.set(authorRef, {
      ...authorData,
      uid: authUser.user.uid,
      role: 'author',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create user profile for authentication
    const userRef = doc(collection(db, "users"))
    batch.set(userRef, {
      name: authorData.name,
      email: authorData.email,
      mobile: authorData.mobile,
      role: 'author',
      uid: authUser.user.uid,
      createdAt: serverTimestamp(),
    })

    // Commit the batch transaction
    await batch.commit()

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
  } catch (error: any) {
    console.error('Error creating author account:', error)
    
    // Handle specific Firebase Auth errors with better messages
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
      throw new Error('Failed to create author account. Please try again.')
    }
  }
}

// Upgrade existing customer to author
export const upgradeCustomerToAuthor = async (authorData: any, existingUserId: string) => {
  try {
    // Use transaction to ensure atomicity of database operations
    const batch = writeBatch(db)
    
    // Create author profile in Firestore
    const authorRef = doc(collection(db, "authors"))
    batch.set(authorRef, {
      ...authorData,
      uid: existingUserId,
      role: 'author',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Update user role in users collection
    const usersQuery = query(collection(db, "users"), where("uid", "==", existingUserId))
    const usersSnapshot = await getDocs(usersQuery)
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0]
      batch.update(doc(db, "users", userDoc.id), {
        role: 'author',
        updatedAt: serverTimestamp()
      })
    }

    // Update user profile in userProfiles collection
    const userProfileDoc = await getDoc(doc(db, "userProfiles", existingUserId))
    if (userProfileDoc.exists()) {
      batch.update(doc(db, "userProfiles", existingUserId), {
        role: 'author',
        updatedAt: serverTimestamp()
      })
    } else {
      // Create user profile if it doesn't exist
      batch.set(doc(db, "userProfiles", existingUserId), {
        id: existingUserId,
        email: authorData.email,
        displayName: authorData.name,
        firstName: authorData.name.split(' ')[0] || '',
        lastName: authorData.name.split(' ').slice(1).join(' ') || '',
        phone: authorData.mobile,
        role: 'author',
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

    // Commit the batch transaction
    await batch.commit()

    // Send author welcome email
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

    return { authorRef, existingUserId }
  } catch (error) {
    console.error('Error upgrading customer to author:', error)
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
    
    // First, get all the author's books (both from authorBooks and books collections)
    const authorBooksQuery = query(
      collection(db, "authorBooks"),
      where("authorId", "==", authorId),
      where("stage", "==", "completed")
    )
    const authorBooksSnapshot = await getDocs(authorBooksQuery)
    const authorBooks = authorBooksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]


    // Get the assigned book IDs from completed author books
    const assignedBookIds = authorBooks
      .filter((book: any) => book.assignedBookId)
      .map((book: any) => book.assignedBookId)


    // If a specific bookId is provided, filter to only that book
    const targetBookIds = bookId ? [bookId] : assignedBookIds


    if (targetBookIds.length === 0) {
      return []
    }

    // Get orders that contain the author's books
    const ordersQuery = query(collection(db, "orders"))
    const ordersSnapshot = await getDocs(ordersQuery)
    
    // Get books data to access royalty percentage
    const booksQuery = query(collection(db, "books"))
    const booksSnapshot = await getDocs(booksQuery)
    const booksData = booksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    const salesData: any = {}
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data()
      
      // Include orders with status 'confirmed', 'delivered', and 'pending' (for recent orders)
      if (order.items && (order.status === 'delivered' || order.status === 'confirmed' || order.status === 'pending')) {
        
        for (const item of order.items) {
          // Check if this item belongs to the author's books
          if (!targetBookIds.includes(item.bookId)) {
            continue
          }
          
          const book = booksData.find(b => b.id === item.bookId)
          const royaltyPercentage = (book as any)?.royaltyPercentage || 0
          
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
                royaltyPercentage,
                totalSales: 0,
                totalRevenue: 0,
                affiliateSales: 0,
                affiliateRevenue: 0,
                royaltyAmount: 0
              }
            }
            
            salesData[key].totalSales += item.quantity
            salesData[key].totalRevenue += item.price * item.quantity
            
            // Check if this was an affiliate sale
            if (order.affiliateCode) {
              salesData[key].affiliateSales += item.quantity
              salesData[key].affiliateRevenue += item.price * item.quantity
            }
            
            // Calculate royalty amount
            salesData[key].royaltyAmount = (salesData[key].totalRevenue * royaltyPercentage) / 100
          }
        }
      }
    }
    
    const result = Object.values(salesData)
    return result
  } catch (error) {
    console.error('Error getting author sales report:', error)
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
    
    // Create coupon first - NO DISCOUNT for affiliate tracking
    await addDoc(collection(db, "coupons"), {
      code: couponCode,
      description: `Author affiliate tracking for book`,
      discountType: "percentage",
      discountValue: 0, // 0% discount - just for tracking
      minOrderValue: 0,
      maxDiscountAmount: 0,
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

// Track affiliate link click
export const trackAffiliateClick = async (linkCode: string) => {
  try {
    // Find the affiliate link by linkCode
    const linksQuery = query(
      collection(db, "affiliateLinks"),
      where("linkCode", "==", linkCode),
      where("isActive", "==", true)
    )
    const linksSnapshot = await getDocs(linksQuery)
    
    if (!linksSnapshot.empty) {
      const linkDoc = linksSnapshot.docs[0]
      const linkData = linkDoc.data()
      
      // Increment click count
      await updateDoc(doc(db, "affiliateLinks", linkDoc.id), {
        totalClicks: increment(1),
        updatedAt: serverTimestamp()
      })
      
      return linkData
    }
    
    return null
  } catch (error) {
    console.error('Error tracking affiliate click:', error)
    return null
  }
}

// Track affiliate sale
export const trackAffiliateSale = async (linkCode: string, orderId: string, orderTotal: number) => {
  try {
    // Find the affiliate link by linkCode
    const linksQuery = query(
      collection(db, "affiliateLinks"),
      where("linkCode", "==", linkCode),
      where("isActive", "==", true)
    )
    const linksSnapshot = await getDocs(linksQuery)
    
    if (!linksSnapshot.empty) {
      const linkDoc = linksSnapshot.docs[0]
      const linkData = linkDoc.data()
      
      // Increment sales and revenue
      await updateDoc(doc(db, "affiliateLinks", linkDoc.id), {
        totalSales: increment(1),
        totalRevenue: increment(orderTotal),
        updatedAt: serverTimestamp()
      })
      
      // Update the order with affiliate information
      await updateDoc(doc(db, "orders", orderId), {
        affiliateCode: linkCode,
        affiliateId: linkDoc.id,
        authorId: linkData.authorId
      })
      
      return linkData
    }
    
    return null
  } catch (error) {
    console.error('Error tracking affiliate sale:', error)
    return null
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

// Revoke author access and change role to customer
export const revokeAuthorAccess = async (authorId: string, authorEmail: string) => {
  // Validate email
  if (!authorEmail || !authorEmail.includes('@')) {
    throw new Error('Invalid author email address')
  }
  
  try {
    // 1. Update author status in authors collection
    const authorsQuery = query(collection(db, "authors"), where("uid", "==", authorId))
    const authorsSnapshot = await getDocs(authorsQuery)
    
    if (!authorsSnapshot.empty) {
      const authorDoc = authorsSnapshot.docs[0]
      await updateDoc(doc(db, "authors", authorDoc.id), {
        status: 'revoked',
        revokedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    // 2. Update user role in users collection
    const usersQuery = query(collection(db, "users"), where("uid", "==", authorId))
    const usersSnapshot = await getDocs(usersQuery)
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0]
      await updateDoc(doc(db, "users", userDoc.id), {
        role: 'customer',
        updatedAt: serverTimestamp()
      })
    }

    // 3. Update user profile in userProfiles collection
    const userProfileDoc = await getDoc(doc(db, "userProfiles", authorId))
    if (userProfileDoc.exists()) {
      await updateDoc(doc(db, "userProfiles", authorId), {
        role: 'customer',
        updatedAt: serverTimestamp()
      })
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
    }

    // 4. Delete all author books
    const authorBooksQuery = query(collection(db, "authorBooks"), where("authorId", "==", authorId))
    const authorBooksSnapshot = await getDocs(authorBooksQuery)
    
    const deletePromises = authorBooksSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    // 5. Send notification email to author about access revocation
    try {
      await sendAuthorNotification(
        authorEmail,
        'access_revoked',
        'Your book submission',
        { reason: 'Book rejected' }
      )
    } catch (emailError) {
      console.error('Failed to send access revocation email:', emailError)
      // Don't throw error as the main operation was successful
    }

    return { success: true, authorId, booksDeleted: authorBooksSnapshot.docs.length }
  } catch (error) {
    console.error('Error revoking author access:', error)
    throw error
  }
}

// Delete individual author book
export const deleteAuthorBook = async (bookId: string) => {
  try {
    // Get the book details first to send notification if needed
    const bookDoc = await getDoc(doc(db, "authorBooks", bookId))
    if (!bookDoc.exists()) {
      throw new Error('Book not found')
    }
    
    const bookData = bookDoc.data()
    const assignedBookId = bookData.assignedBookId // This is set when book is published
    const authorId = bookData.authorId
    
    
    // Delete the book document from authorBooks collection
    await deleteDoc(doc(db, "authorBooks", bookId))
    
    // If the book has been published (has assignedBookId), also delete from main books collection
    if (assignedBookId && bookData.stage === 'completed') {
      
      // Import the comprehensive delete function
      const { deleteBookAndAuthorData } = await import('./firebase-utils')
      
      try {
        // Use the comprehensive delete function to handle all related data
        await deleteBookAndAuthorData(assignedBookId)
      } catch (mainBookError) {
        console.error('Failed to delete main book, but author book was deleted:', mainBookError)
        // Don't throw error as the author book deletion was successful
      }
    }
    
    // Check if this author has any other books (either in authorBooks or main books collection)
    let authorHasOtherBooks = false
    
    // Check authorBooks collection
    const otherAuthorBooksQuery = query(
      collection(db, "authorBooks"),
      where("authorId", "==", authorId)
    )
    const otherAuthorBooksSnapshot = await getDocs(otherAuthorBooksQuery)
    
    // Check main books collection
    const otherMainBooksQuery = query(
      collection(db, "books"),
      where("authorId", "==", authorId)
    )
    const otherMainBooksSnapshot = await getDocs(otherMainBooksQuery)
    
    authorHasOtherBooks = !otherAuthorBooksSnapshot.empty || !otherMainBooksSnapshot.empty
    
    
    // Send appropriate notification to author
    if (bookData.authorEmail && bookData.title) {
      try {
        if (authorHasOtherBooks) {
          // Author has other books, just notify about this specific book deletion
          await sendAuthorNotification(
            bookData.authorEmail,
            'book_deleted',
            bookData.title,
            { reason: 'Book removed from catalog' }
          )
        } else {
          // This was the author's only book, notify about rejection
          await sendAuthorNotification(
            bookData.authorEmail,
            'rejected',
            bookData.title
          )
        }
      } catch (emailError) {
        console.error('Failed to send book deletion notification:', emailError)
        // Don't throw error as the main deletion was successful
      }
    }
    
    return { 
      success: true, 
      bookId, 
      bookTitle: bookData.title,
      mainBookDeleted: !!assignedBookId,
      assignedBookId,
      authorHasOtherBooks
    }
  } catch (error) {
    console.error('Error deleting author book:', error)
    throw error
  }
}