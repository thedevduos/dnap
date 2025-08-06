"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Calendar, MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import { useUpdatesAdmin } from "@/hooks/use-updates-admin"
import { deleteUpdate, updateUpdate } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { UpdateModal } from "@/components/admin/update-modal"

export default function AdminUpdates() {
  const { updates, loading } = useUpdatesAdmin()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [updateToDelete, setUpdateToDelete] = useState<any>(null)

  const handleEdit = (update: any) => {
    setSelectedUpdate(update)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const update = updates.find(u => u.id === id)
    setUpdateToDelete(update)
  }

  const confirmDeleteUpdate = async () => {
    if (!updateToDelete) return

    try {
      await deleteUpdate(updateToDelete.id)
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
    } finally {
      setUpdateToDelete(null)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateUpdate(id, { status })
      toast({
        title: "Success",
        description: `Update ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUpdate(null)
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

  const filteredUpdates = updates.filter(update => {
    if (statusFilter === "all") return true
    return update.status === statusFilter
  })

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Updates</CardTitle>
                <p className="text-gray-600">Manage your website updates and promotional messages</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">Filter by Status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 text-lg">Loading updates...</p>
              </div>
            ) : filteredUpdates.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {statusFilter === "all" ? "No Updates Yet" : `No ${statusFilter} Updates`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {statusFilter === "all" 
                    ? "Create your first update to start promoting your content"
                    : `No updates found with ${statusFilter} status`
                  }
                </p>
                {statusFilter === "all" && (
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Update
                  </Button>
                )}
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
                    {filteredUpdates.map((update) => (
                      <TableRow key={update.id} className="hover:bg-gray-50">
                        <TableCell>{getTypeBadge(update.type || "announcement")}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="font-medium text-gray-900">
                            {update.textEnglish}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={update.status || "inactive"}
                            onValueChange={(value) => handleStatusUpdate(update.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
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

      <AlertDialog open={!!updateToDelete} onOpenChange={setUpdateToDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUpdateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUpdate}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}