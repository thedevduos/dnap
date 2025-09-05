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
import { useShippingRates } from "@/hooks/use-shipping-rates"
import { deleteShippingRate, addShippingRate } from "@/lib/firebase-utils"
import { DEFAULT_SHIPPING_RATES } from "@/lib/shipping-rates-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ShippingRateModal } from "@/components/admin/shipping-rate-modal"

export default function AdminShippingRates() {
  const { shippingRates, loading } = useShippingRates()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRate, setSelectedRate] = useState<any>(null)
  const [rateToDelete, setRateToDelete] = useState<any>(null)

  const handleEdit = (rate: any) => {
    setSelectedRate(rate)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const rate = shippingRates.find(r => r.id === id)
    setRateToDelete(rate)
  }

  const confirmDeleteRate = async () => {
    if (!rateToDelete) return

    try {
      await deleteShippingRate(rateToDelete.id)
      toast({
        title: "Success",
        description: "Shipping rate deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shipping rate",
        variant: "destructive",
      })
    } finally {
      setRateToDelete(null)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedRate(null)
  }

  const handleSeedDefaultRates = async () => {
    try {
      for (const rate of DEFAULT_SHIPPING_RATES) {
        await addShippingRate(rate)
      }
      toast({
        title: "Success",
        description: "Default shipping rates have been added!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add default shipping rates",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Rates</h1>
            <p className="text-gray-600">Manage weight-based shipping rates by region</p>
          </div>
          <div className="flex gap-2">
            {shippingRates.length === 0 && (
              <Button onClick={handleSeedDefaultRates} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Default Rates
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shipping Rate
            </Button>
          </div>
        </div>

        {/* Shipping Rates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Weight-Based Shipping Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading shipping rates...</p>
              </div>
            ) : shippingRates.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping rates found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first shipping rate.</p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Rate
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Weight Range</TableHead>
                      <TableHead>Tamil Nadu</TableHead>
                      <TableHead>Other Indian States</TableHead>
                      <TableHead>International</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shippingRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">
                          {rate.minWeight} - {rate.maxWeight} KG
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            ₹{rate.tamilnadu}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            ₹{rate.india}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            ₹{rate.international}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(rate)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(rate.id)}
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Rate Modal */}
        <ShippingRateModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          rate={selectedRate}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!rateToDelete} onOpenChange={() => setRateToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shipping Rate</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the shipping rate for {rateToDelete?.minWeight} - {rateToDelete?.maxWeight} KG? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteRate} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
