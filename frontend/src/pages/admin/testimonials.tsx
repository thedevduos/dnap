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
import { Star, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useTestimonials } from "@/hooks/use-testimonials"
import { deleteTestimonial } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { TestimonialModal } from "@/components/admin/testimonial-modal"

export default function AdminTestimonials() {
  const { testimonials, loading, refetch } = useTestimonials()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null)

  const handleEdit = (testimonial: any) => {
    setSelectedTestimonial(testimonial)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTestimonial(id)
      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTestimonial(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
      />
    ))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Testimonials</h1>
            <p className="text-gray-600">Add, edit, and manage testimonials</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Testimonial
          </Button>
        </div>

        {/* Testimonials Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Testimonials</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading testimonials...</p>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No testimonials found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell>
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{testimonial.name}</TableCell>
                      <TableCell>{testimonial.designation}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {renderStars(testimonial.rating)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(testimonial.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(testimonial)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(testimonial.id)}
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

      <TestimonialModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        testimonial={selectedTestimonial}
        onSuccess={refetch}
      />
    </AdminLayout>
  )
}