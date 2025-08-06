"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Truck, MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import { useShippingMethods } from "@/hooks/use-shipping-methods"
import { deleteShippingMethod } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ShippingMethodModal } from "@/components/admin/shipping-method-modal"

export default function AdminShipping() {
  const { shippingMethods, loading } = useShippingMethods()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [methodToDelete, setMethodToDelete] = useState<any>(null)

  const handleEdit = (method: any) => {
    setSelectedMethod(method)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const method = shippingMethods.find(m => m.id === id)
    setMethodToDelete(method)
  }

  const confirmDeleteMethod = async () => {
    if (!methodToDelete) return

    try {
      await deleteShippingMethod(methodToDelete.id)
      toast({
        title: "Success",
        description: "Shipping method deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shipping method",
        variant: "destructive",
      })
    } finally {
      setMethodToDelete(null)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedMethod(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="secondary">Inactive</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Methods</h1>
            <p className="text-gray-600">Manage delivery options and rates</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shipping Method
          </Button>
        </div>

        {/* Shipping Methods Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Shipping Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading shipping methods...</p>
              </div>
            ) : shippingMethods.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No shipping methods found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippingMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>{method.description}</TableCell>
                      <TableCell>
                        {method.price === 0 ? "Free" : `₹${method.price}`}
                      </TableCell>
                      <TableCell>{method.deliveryTime}</TableCell>
                      <TableCell>{getStatusBadge(method.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(method)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(method.id)}
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

      <ShippingMethodModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        method={selectedMethod}
      />

      <AlertDialog open={!!methodToDelete} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{methodToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMethod}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Method
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}