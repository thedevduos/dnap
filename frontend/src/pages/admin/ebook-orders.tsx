"use client"

import { useState, useEffect } from "react"
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
import { Package, Search, Eye, RefreshCw, Trash2 } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { deleteOrderAndSubscription } from "@/lib/ebook-utils"
import { useToast } from "@/hooks/use-toast"

export default function EbookOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const q = query(collection(db, "ebookOrders"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
      setOrders(ordersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setShowViewModal(true)
  }

  const handleDeleteOrder = (order: any) => {
    setOrderToDelete(order)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return

    try {
      await deleteOrderAndSubscription(orderToDelete.id, orderToDelete.userId, orderToDelete.planId)
      
      toast({
        title: "Order Deleted",
        description: "Order and related subscription have been deleted successfully.",
      })
      
      setShowDeleteConfirm(false)
      setOrderToDelete(null)
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "Failed to delete order and subscription. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter(order =>
    order.planTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const totalRevenue = orders
    .filter(order => order.status === 'confirmed')
    .reduce((sum, order) => sum + (order.amount || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">E-book Orders</h1>
            <p className="text-gray-600">View and manage e-book subscription orders</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-bold">₹</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">₹{totalRevenue.toLocaleString()}</p>
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
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All E-book Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No e-book orders found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(-8)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {order.userId.slice(-8)}
                      </TableCell>
                      <TableCell className="font-medium">{order.planTitle}</TableCell>
                      <TableCell className="font-medium">₹{order.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.paymentMethod === 'razorpay' ? 'Razorpay' : 
                           order.paymentMethod === 'zoho' ? 'Zoho Pay' : 
                           order.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.createdAt?.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteOrder(order)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showViewModal ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>×</Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Order Information</h3>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Order ID:</span> #{selectedOrder.id}</p>
                    <p><span className="font-medium">User ID:</span> {selectedOrder.userId}</p>
                    <p><span className="font-medium">Transaction ID:</span> {selectedOrder.transactionId || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Plan Details</h3>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Plan:</span> {selectedOrder.planTitle}</p>
                    <p><span className="font-medium">Plan ID:</span> {selectedOrder.planId}</p>
                    <p><span className="font-medium">Plan Type:</span> {selectedOrder.planType}</p>
                    <p><span className="font-medium">Duration:</span> {selectedOrder.duration} days</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Payment Information</h3>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Amount:</span> ₹{selectedOrder.amount}</p>
                    <p><span className="font-medium">Payment Method:</span> 
                      <Badge variant="outline" className="ml-2">
                        {selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay' : 
                         selectedOrder.paymentMethod === 'zoho' ? 'Zoho Pay' : 
                         selectedOrder.paymentMethod}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Payment ID:</span> {selectedOrder.paymentId || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Timestamps</h3>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Created:</span> {selectedOrder.createdAt?.toLocaleString()}</p>
                    <p><span className="font-medium">Updated:</span> {selectedOrder.updatedAt?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-gray-700">Notes</h3>
                  <p className="mt-2 p-3 bg-gray-50 rounded-md">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.error && (
                <div>
                  <h3 className="font-semibold text-red-700">Error Details</h3>
                  <p className="mt-2 p-3 bg-red-50 rounded-md text-red-800">{selectedOrder.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showDeleteConfirm ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Confirm Delete</h2>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>×</Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Delete Order and Subscription?</p>
                <p className="text-gray-600 mb-4">
                  This will permanently delete:
                </p>
                <div className="bg-gray-50 p-3 rounded-md text-left">
                  <p><strong>Order:</strong> #{orderToDelete.id.slice(-8)}</p>
                  <p><strong>Plan:</strong> {orderToDelete.planTitle}</p>
                  <p><strong>Amount:</strong> ₹{orderToDelete.amount}</p>
                  <p><strong>User:</strong> {orderToDelete.userId.slice(-8)}</p>
                </div>
                <p className="text-red-600 text-sm mt-3">
                  <strong>Warning:</strong> This action cannot be undone. Both the order and any related subscription will be deleted.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDeleteOrder}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}