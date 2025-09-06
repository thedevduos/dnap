"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Search, MoreHorizontal, Eye, Mail, Ban, RefreshCw, UserCheck, UserX, Trash2 } from "lucide-react"
import { useCustomers } from "@/hooks/use-customers"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { CustomerModal } from "@/components/admin/customer-modal"
import { recalculateCustomerStats } from "@/lib/firebase-utils"
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
// Note: Firebase Auth user deletion requires the user's password
// import { deleteUser, signInWithEmailAndPassword, signOut } from "firebase/auth"

export default function AdminCustomers() {
  const { customers, loading, analytics } = useCustomers()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleRecalculateStats = async () => {
    setIsRecalculating(true)
    try {
      await recalculateCustomerStats()
      toast({
        title: "Stats Recalculated",
        description: "Customer order counts and totals have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate customer stats.",
        variant: "destructive",
      })
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setIsModalOpen(true)
  }

  const handleSuspendCustomer = async (customer: any) => {
    try {
      await updateDoc(doc(db, "userProfiles", customer.id), {
        suspended: true,
        suspendedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({
        title: "Account Suspended",
        description: `${customer.displayName || customer.email}'s account has been suspended.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend account.",
        variant: "destructive",
      })
    }
  }

  const handleUnsuspendCustomer = async (customer: any) => {
    try {
      await updateDoc(doc(db, "userProfiles", customer.id), {
        suspended: false,
        suspendedAt: null,
        updatedAt: serverTimestamp()
      })
      toast({
        title: "Account Restored",
        description: `${customer.displayName || customer.email}'s account has been restored.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore account.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCustomer = (customer: any) => {
    setCustomerToDelete(customer)
    setShowDeleteModal(true)
  }

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return

    setIsDeleting(true)
    try {
      const customerId = customerToDelete.id
      const customerEmail = customerToDelete.email

      // Create a batch for atomic operations
      const batch = writeBatch(db)

      // 1. Delete from userProfiles collection
      const userProfileRef = doc(db, "userProfiles", customerId)
      batch.delete(userProfileRef)

      // 2. Delete from users collection (if exists)
      const usersQuery = query(collection(db, "users"), where("uid", "==", customerId))
      const usersSnapshot = await getDocs(usersQuery)
      usersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 3. Delete all orders for this customer
      const ordersQuery = query(collection(db, "orders"), where("userId", "==", customerId))
      const ordersSnapshot = await getDocs(ordersQuery)
      ordersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 4. Delete all reviews by this customer
      const reviewsQuery = query(collection(db, "reviews"), where("userId", "==", customerId))
      const reviewsSnapshot = await getDocs(reviewsQuery)
      reviewsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 5. Delete all transactions for this customer
      const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", customerId))
      const transactionsSnapshot = await getDocs(transactionsQuery)
      transactionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 6. Delete from subscribers if exists
      const subscribersQuery = query(collection(db, "subscribers"), where("email", "==", customerEmail))
      const subscribersSnapshot = await getDocs(subscribersQuery)
      subscribersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 7. Delete from job applications if exists
      const jobApplicationsQuery = query(collection(db, "jobApplications"), where("email", "==", customerEmail))
      const jobApplicationsSnapshot = await getDocs(jobApplicationsQuery)
      jobApplicationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 8. Delete from messages if exists
      const messagesQuery = query(collection(db, "messages"), where("email", "==", customerEmail))
      const messagesSnapshot = await getDocs(messagesQuery)
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 9. Delete from authors collection if customer is an author
      const authorsQuery = query(collection(db, "authors"), where("uid", "==", customerId))
      const authorsSnapshot = await getDocs(authorsQuery)
      authorsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 10. Delete author books if customer is an author
      const authorBooksQuery = query(collection(db, "authorBooks"), where("authorId", "==", customerId))
      const authorBooksSnapshot = await getDocs(authorBooksQuery)
      authorBooksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // 11. Delete affiliate links if customer is an author
      const affiliateLinksQuery = query(collection(db, "affiliateLinks"), where("authorId", "==", customerId))
      const affiliateLinksSnapshot = await getDocs(affiliateLinksQuery)
      affiliateLinksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // Commit the batch
      await batch.commit()

      // 12. Firebase Auth user handling
      // Note: Firebase client SDK only allows users to delete their own accounts
      // Since we don't have the customer's password, the Firebase Auth user will become orphaned
      // This is acceptable as the customer cannot access the app without their Firestore data
      console.log('Firebase Auth user will become orphaned - Firestore data deleted successfully')
      console.log('The customer will not be able to access the app anymore')

      toast({
        title: "Customer Deleted",
        description: `${customerToDelete.displayName || customerToDelete.email} and all related data have been permanently deleted.`,
      })

      setShowDeleteModal(false)
      setCustomerToDelete(null)

    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === "active") {
      return matchesSearch && !customer.suspended
    } else if (activeTab === "suspended") {
      return matchesSearch && customer.suspended
    }
    return matchesSearch
  })

  const activeCustomers = customers.filter(customer => !customer.suspended)
  const suspendedCustomers = customers.filter(customer => customer.suspended)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Customers ({customers.length})</h1>
            <p className="text-gray-600">Manage customer accounts and view their activity</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRecalculateStats}
              disabled={isRecalculating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? "Recalculating..." : "Recalculate Stats"}
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCustomers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-red-600">{suspendedCustomers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold">📧</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Newsletter</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.newsletter}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-bold">🛒</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Orders</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.withOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Active Customers ({activeCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="suspended" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Suspended Accounts ({suspendedCustomers.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Customers ({filteredCustomers.length})</CardTitle>
              </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No customers found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {customer.photoURL ? (
                            <img
                              src={customer.photoURL}
                              alt={customer.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {customer.displayName?.charAt(0) || customer.email?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{customer.displayName || "N/A"}</p>
                            {customer.preferences?.newsletter && (
                              <Badge variant="outline" className="text-xs">Newsletter</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {customer.orderCount || 0} orders
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{customer.totalSpent || 0}
                      </TableCell>
                      <TableCell>
                        {customer.createdAt?.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleSuspendCustomer(customer)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteCustomer(customer)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>
          
          <TabsContent value="suspended">
            <Card>
              <CardHeader>
                <CardTitle>Suspended Accounts ({filteredCustomers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading customers...</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No suspended accounts found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Suspended Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {customer.photoURL ? (
                                <img
                                  src={customer.photoURL}
                                  alt={customer.displayName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="text-xs font-medium text-red-600">
                                    {customer.displayName?.charAt(0) || customer.email?.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{customer.displayName || "N/A"}</p>
                                <Badge variant="destructive" className="text-xs">Suspended</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {customer.orderCount || 0} orders
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{customer.totalSpent || 0}
                          </TableCell>
                          <TableCell>
                            {customer.suspendedAt?.toDate().toLocaleDateString() || "N/A"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={() => handleUnsuspendCustomer(customer)}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Restore Account
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteCustomer(customer)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CustomerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        customer={selectedCustomer}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600">Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Trash2 className="h-16 w-16 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600">Permanent Deletion</h3>
              <p className="text-muted-foreground mt-2">
                Are you sure you want to permanently delete <strong>{customerToDelete?.displayName || customerToDelete?.email}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This action will delete ALL customer data including:
              </p>
              <ul className="text-sm text-gray-600 mt-2 text-left">
                <li>• User profile and account information</li>
                <li>• All orders and order history</li>
                <li>• All reviews and ratings</li>
                <li>• All transactions and payments</li>
                <li>• Newsletter subscriptions</li>
                <li>• Job applications</li>
                <li>• Contact messages</li>
                <li>• Author data (if applicable)</li>
                <li>• Books and affiliate links (if author)</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The Firebase Authentication account will become orphaned but cannot access the app. 
                  The customer will be unable to log in since all their data is removed.
                </p>
              </div>
              <p className="text-sm text-red-600 mt-2 font-semibold">
                This action cannot be undone!
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={confirmDeleteCustomer}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}