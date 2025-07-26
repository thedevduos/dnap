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
            <p className="text-gray-600">Add, edit, and manage latest updates</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Update
          </Button>
        </div>

        {/* Updates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading updates...</p>
              </div>
            ) : updates.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No updates found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Text (English)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell>{getTypeBadge(update.type || "announcement")}</TableCell>
                      <TableCell className="max-w-xs truncate">{update.textEnglish}</TableCell>
                      <TableCell>{getStatusBadge(update.status)}</TableCell>
                      <TableCell>
                        {update.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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