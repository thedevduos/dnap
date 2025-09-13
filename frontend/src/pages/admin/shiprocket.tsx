"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { 
  Truck, 
  Search, 
  MoreHorizontal, 
  RefreshCw, 
  ExternalLink,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cancelShipment } from "@/lib/shiprocket-utils"

interface ShiprocketOrder {
  id: string
  orderNumber: string
  shiprocketOrderId: string
  shiprocketAWB: string
  courierName: string
  trackingUrl: string
  status: string
  createdAt: any
  customerName: string
  customerEmail: string
  shippingAddress: any
  items: any[]
  total: number
  paymentMethod: string
}

export default function AdminShiprocket() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<ShiprocketOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<ShiprocketOrder | null>(null)

  const fetchShiprocketOrders = async () => {
    try {
      setLoading(true)
      const ordersRef = collection(db, "orders")
      const q = query(
        ordersRef,
        where("shiprocketOrderId", "!=", null),
        orderBy("shiprocketOrderId"),
        orderBy("createdAt", "desc")
      )
      
      const querySnapshot = await getDocs(q)
      const ordersData: ShiprocketOrder[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.shiprocketOrderId) {
          ordersData.push({
            id: doc.id,
            ...data
          } as ShiprocketOrder)
        }
      })
      
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching Shiprocket orders:', error)
      toast({
        title: "Error",
        description: "Failed to fetch Shiprocket orders.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShiprocketOrders()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchShiprocketOrders()
    setRefreshing(false)
  }

  const handleCancelPickup = async (order: ShiprocketOrder) => {
    setOrderToCancel(order)
  }

  const confirmCancelPickup = async () => {
    if (!orderToCancel) return

    try {
      await cancelShipment(orderToCancel.shiprocketOrderId)
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderToCancel.id 
          ? { ...order, status: 'cancelled' }
          : order
      ))
      
      toast({
        title: "Pickup Cancelled",
        description: "Shiprocket pickup has been cancelled successfully.",
      })
    } catch (error: any) {
      console.error('Error cancelling pickup:', error)
      toast({
        title: "Error",
        description: `Failed to cancel pickup: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setOrderToCancel(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800">Shipped</Badge>
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shiprocketOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shiprocketAWB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.courierName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const analytics = {
    total: orders.length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    pending: orders.filter(o => o.status === 'pending').length
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shiprocket Management</h1>
            <p className="text-muted-foreground">
              Manage all Shiprocket pickups and track shipments
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Pickups</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Shipped</p>
                  <p className="text-2xl font-bold">{analytics.shipped}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Delivered</p>
                  <p className="text-2xl font-bold">{analytics.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">{analytics.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Cancelled</p>
                  <p className="text-2xl font-bold">{analytics.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order number, AWB, customer name, or courier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shiprocket Pickups ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shiprocket Orders Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? "No orders match your current filters." 
                    : "No orders have been processed through Shiprocket yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Courier</TableHead>
                      <TableHead>AWB</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">ID: {order.shiprocketOrderId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-gray-500">{order.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <span>{order.courierName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.shiprocketAWB ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {order.shiprocketAWB}
                            </code>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            {getStatusBadge(order.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">₹{order.total}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.trackingUrl && (
                                <DropdownMenuItem asChild>
                                  <a 
                                    href={order.trackingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Track Shipment
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <DropdownMenuItem 
                                  onClick={() => handleCancelPickup(order)}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Pickup
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Pickup Confirmation Dialog */}
        <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Shiprocket Pickup</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this Shiprocket pickup? This action cannot be undone.
                <br /><br />
                <strong>Order:</strong> {orderToCancel?.orderNumber}<br />
                <strong>Courier:</strong> {orderToCancel?.courierName}<br />
                <strong>AWB:</strong> {orderToCancel?.shiprocketAWB || 'N/A'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmCancelPickup}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Pickup
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
