export interface Author {
  id: string
  name: string
  email: string
  mobile: string
  city: string
  phone: string
  address: string
  uid: string
  role: 'author'
  status: 'pending' | 'active' | 'suspended'
  createdAt: Date
  updatedAt: Date
}

export interface AuthorBook {
  id: string
  authorId: string
  authorName: string
  authorEmail?: string
  title: string
  category: string
  pages: number
  language: string
  description: string
  weight?: number
  length?: number
  width?: number
  height?: number
  pdfUrl: string
  imageUrl: string
  wordDocUrl?: string
  stage: 'review' | 'payment' | 'payment_verification' | 'editing' | 'completed'
  paymentAmount?: number
  paymentScreenshot?: string
  paymentStatus: 'pending' | 'paid' | 'verified'
  jiraProjectKey?: string
  jiraProjectId?: string
  assignedBookId?: string // Reference to the actual book in books collection
  createdAt: Date
  updatedAt: Date
}

export interface AuthorSalesReport {
  bookId: string
  bookTitle: string
  month: number
  year: number
  totalSales: number
  totalRevenue: number
  affiliateSales: number
  affiliateRevenue: number
}

export interface AffiliateLink {
  id: string
  authorId: string
  bookId: string
  couponCode: string
  linkCode: string
  url: string
  isActive: boolean
  totalClicks: number
  totalSales: number
  totalRevenue: number
  createdAt: Date
  updatedAt: Date
}