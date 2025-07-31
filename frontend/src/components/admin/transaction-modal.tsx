"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Package, User, Calendar, RefreshCw } from "lucide-react"
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
    setIsProcessingRefund(true)
    try {
      await processRefund(transaction.id, transaction.amount)
      toast({
        title: "Refund Processed",
        description: "Refund has been initiated successfully.",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process refund.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Transaction Details</DialogTitle>
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Transaction ID</span>
              </div>
              <p className="font-mono text-sm">{transaction.id}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Order ID</span>
              </div>
              <p className="font-mono text-sm">#{transaction.orderId?.slice(-8)}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Customer</span>
              </div>
              <div>
                <p className="font-medium">{transaction.customerName}</p>
                <p className="text-sm text-muted-foreground">{transaction.customerEmail}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date</span>
              </div>
              <p className="text-sm">
                {transaction.createdAt?.toDate().toLocaleString()}
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
                <span className="font-semibold">₹{transaction.amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span>{transaction.paymentMethod || "PayU"}</span>
              </div>
              <div className="flex justify-between">
                <span>Gateway Transaction ID</span>
                <span className="font-mono text-sm">{transaction.gatewayTransactionId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          {transaction.status === "success" && (
            <div className="pt-4 border-t">
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
                    Process Full Refund (₹{transaction.amount})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}