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
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, storage, auth } from "@/lib/firebase"
import { sendWelcomeEmail } from "./email-utils"

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
