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
import { Calendar, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useUpdatesAdmin } from "@/hooks/use-updates-admin"
import { deleteUpdate } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { UpdateModal } from "@/components/admin/update-modal"

export default function AdminUpdates() {
  const { updates, loading } = useUpdatesAdmin()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null)

  const handleEdit = (update: any) => {
    setSelectedUpdate(update)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUpdate(id)
      toast({
        title: "Success",
        description: "Update deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete update",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUpdate(null)
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "announcement":
        return <Badge className="bg-blue-600">Announcement</Badge>
      case "news":
        return <Badge className="bg-purple-600">News</Badge>
      case "event":
        return <Badge className="bg-orange-600">Event</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Updates</h1>
            <p className="text-gray-600">Create and manage promotional banners and announcements</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Update
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {updates.filter(u => u.status === 'active').length}
            </div>
            <div className="text-gray-600">Active Updates</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {updates.filter(u => u.type === 'announcement').length}
            </div>
            <div className="text-gray-600">Announcements</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {updates.filter(u => u.type === 'news').length}
            </div>
            <div className="text-gray-600">News Items</div>
          </Card>
        </div>

        {/* Updates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Updates</CardTitle>
            <p className="text-gray-600">Manage your website updates and promotional messages</p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 text-lg">Loading updates...</p>
              </div>
            ) : updates.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Updates Yet</h3>
                <p className="text-gray-600 mb-6">Create your first update to start promoting your content</p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Update
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Message</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {updates.map((update) => (
                      <TableRow key={update.id} className="hover:bg-gray-50">
                        <TableCell>{getTypeBadge(update.type || "announcement")}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="font-medium text-gray-900">
                            {update.textEnglish}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(update.status)}</TableCell>
                        <TableCell className="text-gray-600">
                          {update.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(update)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(update.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UpdateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        update={selectedUpdate}
        onSuccess={() => {}}
      />
    </AdminLayout>
  )
}