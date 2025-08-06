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
import { Tag, Search, MoreHorizontal, Edit, Trash2, Plus, Copy } from "lucide-react"
import { useCoupons } from "@/hooks/use-coupons"
import { deleteCoupon } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { CouponModal } from "@/components/admin/coupon-modal"

export default function AdminCoupons() {
  const { coupons, loading } = useCoupons()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)
  const [couponToDelete, setCouponToDelete] = useState<any>(null)

  const handleEdit = (coupon: any) => {
    setSelectedCoupon(coupon)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const coupon = coupons.find(c => c.id === id)
    setCouponToDelete(coupon)
  }

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return

    try {
      await deleteCoupon(couponToDelete.id)
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      })
    } finally {
      setCouponToDelete(null)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied!",
      description: "Coupon code copied to clipboard",
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCoupon(null)
  }

  const getStatusBadge = (coupon: any) => {
    const now = new Date()
    const expiryDate = coupon.expiryDate?.toDate()
    
    if (coupon.status === "inactive") {
      return <Badge variant="secondary">Inactive</Badge>
    }
    
    if (expiryDate && expiryDate < now) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Limit Reached</Badge>
    }
    
    return <Badge className="bg-green-600">Active</Badge>
  }

  const getDiscountDisplay = (coupon: any) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`
    } else {
      return `₹${coupon.discountValue}`
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
            <p className="text-gray-600">Create and manage discount coupons</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Coupon
          </Button>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No coupons found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold">{coupon.code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDiscountDisplay(coupon)}
                      </TableCell>
                      <TableCell>
                        {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "No minimum"}
                      </TableCell>
                      <TableCell>
                        {coupon.usedCount || 0} / {coupon.usageLimit || "∞"}
                      </TableCell>
                      <TableCell>
                        {coupon.oncePerUser ? (
                          <Badge variant="outline" className="text-xs">
                            Once per user
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Multiple use
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {coupon.expiryDate?.toDate().toLocaleDateString() || "No expiry"}
                      </TableCell>
                      <TableCell>{getStatusBadge(coupon)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyCode(coupon.code)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Code
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(coupon.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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

      <CouponModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        coupon={selectedCoupon}
      />

      <AlertDialog open={!!couponToDelete} onOpenChange={setCouponToDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your coupon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCouponToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCoupon}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}