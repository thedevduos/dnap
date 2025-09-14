"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Package, Search, MoreHorizontal, Eye, Edit, RefreshCw, Truck, X } from "lucide-react"
import { Trash2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOrdersAdmin } from "@/hooks/use-orders-admin"
import { updateOrderStatus, deleteOrder } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { OrderModal } from "@/components/admin/order-modal"

export default function AdminOrders() {
  const { orders, loading, analytics } = useOrdersAdmin()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [orderToDelete, setOrderToDelete] = useState<any>(null)

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      })
    }
  }

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleDeleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    setOrderToDelete(order)
  }

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return

    try {
      await deleteOrder(orderToDelete.id)
      toast({
        title: "Order Deleted",
        description: "Order has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order.",
        variant: "destructive",
      })
    } finally {
      setOrderToDelete(null)
    }
  }

  const handleCancelOrder = async (order: any) => {
    // Prevent cancellation of delivered orders
    if (order.status === "delivered") {
      toast({
        title: "Cannot Cancel Order",
        description: "Delivered orders cannot be cancelled.",
        variant: "destructive",
      })
      return
    }
    
    if (window.confirm(`Are you sure you want to cancel this order? The order status will be updated to cancelled. Refunds and Shiprocket cancellations will be handled manually.`)) {
      try {
        // Update order status to cancelled
        await updateOrderStatus(order.id, "cancelled")
        
        toast({
          title: "Order Cancelled",
          description: "Order status has been updated to cancelled. Please handle refunds and Shiprocket cancellations manually.",
        })
      } catch (error: any) {
        console.error('Error cancelling order:', error)
        toast({
          title: "Error",
          description: `Failed to cancel order: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        })
      }
    }
  }
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shippingAddress?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shippingAddress?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    // Filter based on active tab
    let matchesTab = false
    if (activeTab === "all") {
      // Exclude cancelled orders from "All Orders" tab
      matchesTab = order.status !== "cancelled"
    } else if (activeTab === "cancelled") {
      // Only show cancelled orders in "Cancelled Orders" tab
      matchesTab = order.status === "cancelled"
    }
    
    return matchesSearch && matchesStatus && matchesTab
  })

  const cancelledOrders = orders.filter(order => order.status === "cancelled")
  const activeOrders = orders.filter(order => order.status !== "cancelled")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "shipped": return "bg-purple-100 text-purple-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{analytics.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Shipped</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.shipped}</p>
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
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{cancelledOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  {activeTab === "cancelled" && (
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table with Tabs */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Active Orders ({activeOrders.length})</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled Orders ({cancelledOrders.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {activeTab === "cancelled" ? "No cancelled orders found" : "No orders found"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id || ''}>
                      <TableCell className="font-medium">
                        {order.orderNumber || `#${order.id?.slice(-8) || ''}`}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.userEmail || "Guest"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {order.items?.length || 0} items
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{order.total}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status || '')}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.createdAt?.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {order.status !== "cancelled" && order.status !== "delivered" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id || '', "confirmed")}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Mark Confirmed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id || '', "shipped")}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Mark Shipped
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id || '', "delivered")}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Mark Delivered
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status !== "cancelled" && order.status !== "delivered" && (
                              <DropdownMenuItem 
                                onClick={() => handleCancelOrder(order)}
                                className="text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteOrder(order.id || '')}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Order
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
      </div>

      <OrderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        order={selectedOrder}
      />

      <AlertDialog open={!!orderToDelete} onOpenChange={setOrderToDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOrder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}