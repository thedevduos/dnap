"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { CreditCard, Search, MoreHorizontal, Eye, RefreshCw, Download, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTransactions } from "@/hooks/use-transactions"
import { processRefund } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { TransactionModal } from "@/components/admin/transaction-modal"

export default function AdminPayments() {
  const { transactions, loading, analytics, firestoreTransactions, pgTransactions } = useTransactions()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [processingRefund, setProcessingRefund] = useState<string | null>(null)

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleRefund = async (transaction: any) => {
    const transactionId = transaction.gatewayTransactionId || transaction.id
    const amount = transaction.amount || 0
    const paymentMethod = transaction.paymentMethod || 'razorpay'
    
    if (!transactionId) {
      toast({
        title: "Error",
        description: "Transaction ID not found. Cannot process refund.",
        variant: "destructive",
      })
      return
    }
    
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Invalid transaction amount. Cannot process refund.",
        variant: "destructive",
      })
      return
    }
    
    setProcessingRefund(transactionId)
    try {
      await processRefund(transactionId, amount, paymentMethod)
      toast({
        title: "Refund Processed",
        description: "Refund has been initiated successfully.",
      })
    } catch (error: any) {
      console.error('Refund error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process refund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingRefund(null)
    }
  }

  // Filter transactions based on active tab
  const getTransactionsForTab = () => {
    switch (activeTab) {
      case "firestore":
        return firestoreTransactions || []
      case "gateway":
        return pgTransactions || []
      case "all":
      default:
        return transactions || []
    }
  }

  const filteredTransactions = getTransactionsForTab().filter(transaction => {
    if (!transaction || !transaction.id) return false
    
    const matchesSearch = transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPaymentMethod = paymentMethodFilter === "all" || 
                                transaction.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()
    return matchesSearch && matchesPaymentMethod
  })

  const getStatusColor = (status: string, refundStatus?: string) => {
    // Check for refund status first
    if (refundStatus === "partial" || refundStatus === "full") {
      return "bg-purple-100 text-purple-800"
    }
    
    switch (status) {
      case "success": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      case "refunded": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusDisplay = (status: string, refundStatus?: string) => {
    if (refundStatus === "partial") {
      return "Partially Refunded"
    }
    if (refundStatus === "full") {
      return "Fully Refunded"
    }
    return status
  }

  const canProcessRefund = (transaction: any) => {
    const status = transaction.status || ''
    const refundStatus = transaction.refundStatus || ''
    
    return status === "success" && 
           refundStatus !== "full" && 
           refundStatus !== "partial" &&
           transaction.amount > 0
  }

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A'
    
    try {
      if (typeof dateValue === 'object' && 'toDate' in dateValue) {
        return dateValue.toDate().toLocaleDateString()
      } else if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleDateString()
      } else if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString()
      }
      return 'N/A'
    } catch (error) {
      console.warn('Error formatting date:', error)
      return 'N/A'
    }
  }

  const renderTransactionsTable = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      )
    }

    if (filteredTransactions.length === 0) {
      return (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
          <p className="text-gray-600">
            {searchTerm || paymentMethodFilter !== "all" 
              ? "No transactions match your search criteria." 
              : activeTab === "firestore" 
                ? "No transactions found in database."
                : activeTab === "gateway"
                  ? "No transactions found from payment gateways."
                  : "No transactions found."}
          </p>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((transaction) => (
            <TableRow key={`${transaction.id}-${transaction.paymentMethod}`}>
              <TableCell className="font-mono text-sm">
                <div>
                  <span>{(transaction.gatewayTransactionId || transaction.id)?.slice(-8) || 'N/A'}</span>
                  {activeTab === "all" && (
                    <div className="text-xs text-muted-foreground">
                      {firestoreTransactions?.some(ft => ft.id === transaction.id) ? 'DB' : 'Gateway'}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {transaction.orderId ? `#${transaction.orderId.toString().slice(-8)}` : 'N/A'}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{transaction.customerName || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.customerEmail || 'No email'}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                ₹{typeof transaction.amount === 'number' ? transaction.amount.toLocaleString() : transaction.amount || '0'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {transaction.paymentMethod === 'razorpay' ? 'Razorpay' :
    transaction.paymentMethod === 'zoho' ? 'Zoho Pay' :
    transaction.paymentMethod || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(transaction.status || '', transaction.refundStatus)}>
                  {getStatusDisplay(transaction.status || '', transaction.refundStatus)}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDate(transaction.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {canProcessRefund(transaction) && (
                      <DropdownMenuItem 
                        onClick={() => handleRefund(transaction)}
                        disabled={processingRefund === (transaction.gatewayTransactionId || transaction.id)}
                        className="text-red-600"
                      >
                        {processingRefund === (transaction.gatewayTransactionId || transaction.id) 
                          ? "Processing..." 
                          : "Process Refund"}
                      </DropdownMenuItem>
                    )}
                    {!canProcessRefund(transaction) && transaction.status === "success" && (
                      <DropdownMenuItem disabled>
                        Already Refunded
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600">View transactions and process refunds</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.successful}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-bold">✗</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-bold">↩</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Refunded</p>
                  <p className="text-2xl font-bold text-purple-600">₹{analytics.refunded.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-600 font-bold">#</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-600">{analytics.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gateway Only</p>
                  <p className="text-2xl font-bold text-orange-600">{pgTransactions?.length || 0}</p>
                  <p className="text-xs text-gray-500">
                    {pgTransactions?.filter(t => t.paymentMethod === 'zoho').length || 0} Zoho Pay
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                  <SelectItem value="zoho">Zoho Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    Transactions ({filteredTransactions.length})
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    View and manage all payment transactions
                  </p>
                </div>
                <TabsList>
                  <TabsTrigger value="all">All Sources</TabsTrigger>
                  <TabsTrigger value="firestore">Database Only</TabsTrigger>
                  <TabsTrigger value="gateway">Gateway Only</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="all" className="mt-0">
                {renderTransactionsTable()}
              </TabsContent>
              <TabsContent value="firestore" className="mt-0">
                {renderTransactionsTable()}
              </TabsContent>
              <TabsContent value="gateway" className="mt-0">
                {renderTransactionsTable()}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <TransactionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        transaction={selectedTransaction}
      />
    </AdminLayout>
  )
}