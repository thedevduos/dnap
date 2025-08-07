"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { BookOpen, Users, Package, Settings, Eye, Edit, Trash2 } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useEbookPlans } from "@/hooks/use-ebook-plans"
import { useEbookSubscriptions } from "@/hooks/use-ebook-subscriptions"
import { useBooks } from "@/hooks/use-books"

export default function EbookManagementPage() {
  const { plans, loading: plansLoading } = useEbookPlans()
  const { subscriptions, loading: subscriptionsLoading } = useEbookSubscriptions()
  const { books, loading: booksLoading } = useBooks()

  // Filter books that have PDF
  const ebooksWithPdf = books.filter(book => book.pdfUrl)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "expired": return "bg-red-100 text-red-800"
      case "cancelled": return "bg-gray-100 text-gray-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    if (date.toDate) return date.toDate().toLocaleDateString()
    if (date instanceof Date) return date.toLocaleDateString()
    return new Date(date).toLocaleDateString()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">E-book Management</h1>
            <p className="text-gray-600">Manage e-book plans, subscriptions, and content</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">E-books Available</p>
                  <p className="text-2xl font-bold">{ebooksWithPdf.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold">{plans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold">
                    {subscriptions.filter(s => s.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">₹0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="ebooks">E-books</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>All E-book Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No subscriptions found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Books</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>{subscription.userId}</TableCell>
                          <TableCell className="font-medium">{subscription.planTitle}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {subscription.planType === 'single' ? 'Single' : 'Multiple'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(subscription.status)}>
                              {subscription.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(subscription.startDate)}</TableCell>
                          <TableCell>{formatDate(subscription.endDate)}</TableCell>
                          <TableCell>
                            {subscription.selectedBooks?.length || 0} books
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>E-book Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                      <Card key={plan.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{plan.title}</CardTitle>
                            {plan.popular && (
                              <Badge className="bg-orange-500">Popular</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-2xl font-bold text-primary">₹{plan.price}</p>
                              <p className="text-sm text-muted-foreground">{plan.period}</p>
                            </div>
                            
                            <p className="text-sm">{plan.description}</p>
                            
                            <div className="space-y-2">
                              <Badge variant="outline">
                                {plan.type === 'single' ? 'Single E-book' : 'Multiple E-books'}
                              </Badge>
                              {plan.maxBooks && (
                                <Badge variant="secondary">
                                  Max {plan.maxBooks} books
                                </Badge>
                              )}
                              <Badge variant="secondary">
                                {plan.duration} days
                              </Badge>
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ebooks">
            <Card>
              <CardHeader>
                <CardTitle>E-books with PDF</CardTitle>
              </CardHeader>
              <CardContent>
                {booksLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : ebooksWithPdf.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No e-books with PDF found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cover</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>PDF Size</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ebooksWithPdf.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell>
                            <img
                              src={book.imageUrl}
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{book.title}</TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{book.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {book.pdfSize ? `${(book.pdfSize / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {book.ebookVisibility?.general && (
                                <Badge variant="secondary" className="text-xs">General</Badge>
                              )}
                              {book.ebookVisibility?.singleEbooks && (
                                <Badge variant="secondary" className="text-xs">Single</Badge>
                              )}
                              {book.ebookVisibility?.plans?.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {book.ebookVisibility.plans.length} plans
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}