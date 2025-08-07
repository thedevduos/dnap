"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Package, User, Calendar, RefreshCw, AlertTriangle, Database, Globe } from "lucide-react"
import { processRefund } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: any
}

export function TransactionModal({ open, onOpenChange, transaction }: TransactionModalProps) {
  const { toast } = useToast()
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)

  if (!transaction) return null

  const handleRefund = async () => {
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
    
    setIsProcessingRefund(true)
    try {
      await processRefund(transactionId, amount, paymentMethod)
      toast({
        title: "Refund Processed",
        description: "Refund has been initiated successfully.",
      })
      onOpenChange(false)
    } catch (error: any) {
      console.error('Refund processing error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process refund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingRefund(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      case "refunded": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const canProcessRefund = () => {
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
        return dateValue.toDate().toLocaleString()
      } else if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleString()
      } else if (dateValue instanceof Date) {
        return dateValue.toLocaleString()
      }
      return 'N/A'
    } catch (error) {
      return 'N/A'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Transaction Details</DialogTitle>
            <div className="flex gap-2">
              <Badge className={getStatusColor(transaction.status || '')}>
                {transaction.status || 'Unknown'}
              </Badge>
              {transaction.refundStatus && (
                <Badge variant="outline" className="text-purple-600">
                  {transaction.refundStatus}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Source */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            {transaction.createdAt && typeof transaction.createdAt === 'object' && 'toDate' in transaction.createdAt ? (
              <Database className="h-4 w-4 text-blue-600" />
            ) : (
              <Globe className="h-4 w-4 text-orange-600" />
            )}
            <span className="text-sm font-medium">
              {transaction.createdAt && typeof transaction.createdAt === 'object' && 'toDate' in transaction.createdAt 
                ? 'Database Transaction' 
                : 'Payment Gateway Transaction'}
            </span>
          </div>

          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Transaction ID</span>
              </div>
              <p className="font-mono text-sm break-all">{transaction.gatewayTransactionId || transaction.id}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Order ID</span>
              </div>
              <p className="font-mono text-sm">
                {transaction.orderId ? `#${transaction.orderId.toString().slice(-8)}` : 'N/A'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Customer</span>
              </div>
              <div>
                <p className="font-medium">{transaction.customerName || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{transaction.customerEmail || 'No email'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date</span>
              </div>
              <p className="text-sm">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-semibold">
                  ₹{typeof transaction.amount === 'number' ? transaction.amount.toLocaleString() : transaction.amount || '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span>
                  {transaction.paymentMethod === 'razorpay' ? 'Razorpay' :
                transaction.paymentMethod === 'zoho' ? 'Zoho Pay' :
                transaction.paymentMethod || "Razorpay"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gateway Transaction ID</span>
                <span className="font-mono text-sm break-all">
                  {transaction.gatewayTransactionId || transaction.id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <Badge className={getStatusColor(transaction.status || '')}>
                  {transaction.status || 'Unknown'}
                </Badge>
              </div>
              {transaction.refundAmount && transaction.refundAmount > 0 && (
                <div className="flex justify-between">
                  <span>Refund Amount</span>
                  <span className="font-semibold text-purple-600">
                    ₹{transaction.refundAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {transaction.refundedAt && (
                <div className="flex justify-between">
                  <span>Refunded At</span>
                  <span className="text-sm">{formatDate(transaction.refundedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canProcessRefund() && (
            <div className="pt-4 border-t">
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Refund Warning</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This will process a full refund of ₹{typeof transaction.amount === 'number' ? transaction.amount.toLocaleString() : transaction.amount} 
                  via {transaction.paymentMethod === 'razorpay' ? 'Razorpay' : transaction.paymentMethod === 'zoho' ? 'Zoho Pay' : 'the payment gateway'}.
                  This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleRefund}
                disabled={isProcessingRefund}
                className="w-full"
              >
                {isProcessingRefund ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing Refund...
                  </>
                ) : (
                  <>
                    Process Full Refund (₹{typeof transaction.amount === 'number' ? transaction.amount.toLocaleString() : transaction.amount})
                  </>
                )}
              </Button>
            </div>
          )}
          
          {!canProcessRefund() && transaction.status === "success" && (
            <div className="pt-4 border-t">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  This transaction has already been refunded or is not eligible for refund.
                </p>
              </div>
            </div>
          )}
          
          {transaction.status !== "success" && (
            <div className="pt-4 border-t">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  Only successful transactions can be refunded.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}