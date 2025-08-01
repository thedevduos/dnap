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
import { CreditCard, Search, MoreHorizontal, Eye, RefreshCw, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTransactions } from "@/hooks/use-transactions"
import { processRefund } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { TransactionModal } from "@/components/admin/transaction-modal"

export default function AdminPayments() {
  const { transactions, loading, analytics } = useTransactions()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleRefund = async (transactionId: string, amount: number, paymentMethod: string) => {
    try {
      await processRefund(transactionId, amount, paymentMethod)
      toast({
        title: "Refund Processed",
        description: "Refund has been initiated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to process refund: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Button>
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
                  <p className="text-2xl font-bold">₹{analytics.totalRevenue}</p>
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
                  <p className="text-2xl font-bold text-purple-600">₹{analytics.refunded}</p>
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
                  <SelectItem value="payu">PayU</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {paymentMethodFilter === "all" ? "All Transactions" : 
               paymentMethodFilter === "payu" ? "PayU Transactions" :
               paymentMethodFilter === "razorpay" ? "Razorpay Transactions" :
               "Transactions"} ({filteredTransactions.length})
            </CardTitle>
            {paymentMethodFilter !== "all" && (
              <p className="text-sm text-gray-600">
                {paymentMethodFilter === "payu" ? "PayU payment gateway transactions and refunds" :
                 paymentMethodFilter === "razorpay" ? "Razorpay payment gateway transactions and refunds" :
                 "Payment gateway transactions and refunds"}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions found</p>
              </div>
            ) : (
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
                    <TableRow key={transaction.id || ''}>
                      <TableCell className="font-mono text-sm">
                        {transaction.id?.slice(-8) || ''}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.orderId ? `#${transaction.orderId.slice(-8)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.customerEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{transaction.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.paymentMethod === 'payu' ? 'PayU' :
                           transaction.paymentMethod === 'razorpay' ? 'Razorpay' :
                           transaction.paymentMethod || "PayU"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status || '', transaction.refundStatus)}>
                          {getStatusDisplay(transaction.status || '', transaction.refundStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.createdAt ? 
                          (typeof transaction.createdAt === 'object' && 'toDate' in transaction.createdAt) 
                            ? transaction.createdAt.toDate().toLocaleDateString()
                            : new Date(transaction.createdAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {transaction.status === "success" && (
                              <DropdownMenuItem 
                                onClick={() => handleRefund(transaction.id || '', transaction.amount || 0, transaction.paymentMethod || 'payu')}
                                className="text-red-600"
                              >
                                Process Refund
                              </DropdownMenuItem>
                            )}
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

      <TransactionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        transaction={selectedTransaction}
      />
    </AdminLayout>
  )
}