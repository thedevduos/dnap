export interface EbookPlan {
  id: string
  title: string
  price: number
  period: string
  description: string
  type: 'single' | 'multiple'
  features: string[]
  maxBooks?: number // For single ebook plans
  duration: number // Duration in days
  popular?: boolean
}

export interface EbookSubscription {
  id: string
  userId: string
  planId: string
  planTitle: string
  planType: 'single' | 'multiple'
  selectedBooks: string[] // Book IDs selected by user
  maxBooks?: number
  startDate: Date
  endDate: Date
  status: 'active' | 'expired' | 'cancelled'
  autoRenew: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EbookOrder {
  id: string
  userId: string
  planId: string
  planTitle: string
  amount: number
  paymentMethod: string
  transactionId: string
  status: 'pending' | 'confirmed' | 'failed'
  subscriptionId?: string
  createdAt: Date
}

export interface EbookAccess {
  id: string
  userId: string
  bookId: string
  subscriptionId: string
  accessType: 'plan' | 'individual'
  startDate: Date
  endDate: Date
  status: 'active' | 'expired'
}

export interface BookWithEbook {
  id: string
  title: string
  author: string
  description: string
  price: number
  imageUrl: string
  category: string
  rating: number
  status: string
  pdfUrl?: string
  pdfSize?: number
  ebookVisibility: {
    general: boolean
    singleEbooks: boolean
    plans: string[] // Plan IDs where this book is visible
  }
  createdAt: Date
}