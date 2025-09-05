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
import { Image, MoreHorizontal, Edit, Trash2, Plus, Eye } from "lucide-react"
import { useHeroBanners } from "@/hooks/use-hero-banners"
import { deleteHeroBanner } from "@/lib/firebase-utils"
import { ref, deleteObject } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { HeroBannerModal } from "@/components/admin/hero-banner-modal"

export default function AdminHeroBanners() {
  const { heroBanners, loading } = useHeroBanners()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<any>(null)
  const [bannerToDelete, setBannerToDelete] = useState<any>(null)

  const handleEdit = (banner: any) => {
    setSelectedBanner(banner)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const banner = heroBanners.find(b => b.id === id)
    setBannerToDelete(banner)
  }

  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      // Extract the file path from the URL
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1])
        const storageRef = ref(storage, filePath)
        await deleteObject(storageRef)
      }
    } catch (error) {
      console.error('Error deleting image from storage:', error)
      // Don't throw error as this is cleanup
    }
  }

  const confirmDeleteBanner = async () => {
    if (!bannerToDelete) return

    try {
      // Delete the image from storage first
      if (bannerToDelete.imageUrl) {
        await deleteImageFromStorage(bannerToDelete.imageUrl)
      }
      
      // Then delete the banner document
      await deleteHeroBanner(bannerToDelete.id)
      toast({
        title: "Success",
        description: "Hero banner deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete hero banner",
        variant: "destructive",
      })
    } finally {
      setBannerToDelete(null)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedBanner(null)
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-600">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  const getRedirectTypeBadge = (type: string) => {
    return type === 'page' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">Page</Badge>
    ) : (
      <Badge variant="outline" className="bg-purple-50 text-purple-700">Link</Badge>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hero Banners</h1>
            <p className="text-gray-600">Manage hero section banners and their redirects</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hero Banner
          </Button>
        </div>

        {/* Hero Banners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Banners</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading hero banners...</p>
              </div>
            ) : heroBanners.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hero banners found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first hero banner.</p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Banner
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Redirect</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heroBanners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell>
                          <div className="w-16 h-10 rounded overflow-hidden bg-gray-100">
                            {banner.imageUrl ? (
                              <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Image className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {banner.title}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {banner.redirectValue}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRedirectTypeBadge(banner.redirectType)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{banner.order}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(banner.isActive)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(banner.redirectValue, '_blank')}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(banner)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(banner.id)}
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

        {/* Hero Banner Modal */}
        <HeroBannerModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          banner={selectedBanner}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!bannerToDelete} onOpenChange={() => setBannerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Hero Banner</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the banner "{bannerToDelete?.title}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteBanner} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
