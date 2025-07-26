"use client"

// import { useState } from "react"
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
import { Mail, MoreHorizontal, Trash2, RefreshCw } from "lucide-react"
import { useSubscribers } from "@/hooks/use-subscribers"
import { updateSubscriberStatus, deleteSubscriber } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminEmails() {
  const { subscribers, loading, analytics } = useSubscribers()
  const { toast } = useToast()

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateSubscriberStatus(id, status)
      toast({
        title: "Success",
        description: "Subscriber status updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscriber status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscriber(id)
      toast({
        title: "Success",
        description: "Subscriber deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subscriber",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>
      case "unsubscribed":
        return <Badge variant="destructive">Unsubscribed</Badge>
      default:
        return <Badge className="bg-green-600">Active</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Subscriptions</h1>
            <p className="text-gray-600">Manage newsletter email subscriptions</p>
          </div>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
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
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.active}</p>
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
                  <p className="text-sm font-medium text-gray-600">Unsubscribed</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.unsubscribed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscribers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading subscribers...</p>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No subscribers found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>{getStatusBadge(subscriber.status || "active")}</TableCell>
                      <TableCell>
                        {subscriber.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {subscriber.status !== "active" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(subscriber.id, "active")}>
                                Activate
                              </DropdownMenuItem>
                            )}
                            {subscriber.status !== "unsubscribed" && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(subscriber.id, "unsubscribed")}>
                                Unsubscribe
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(subscriber.id)}
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
    </AdminLayout>
  )
}