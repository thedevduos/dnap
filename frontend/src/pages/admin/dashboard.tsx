"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, MessageSquare, Mail, Calendar } from "lucide-react"
import { useAnalytics } from "@/hooks/use-analytics"
import { useBooks } from "@/hooks/use-books"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminDashboard() {
  const { analytics, loading } = useAnalytics()
  const { books, loading: booksLoading } = useBooks()

  const stats = [
    {
      title: "Total Books",
      value: analytics.totalBooks || 0,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Updates", 
      value: analytics.totalUpdates || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Emails",
      value: analytics.totalSubscribers || 0,
      icon: Mail,
      color: "text-purple-600", 
      bgColor: "bg-purple-100",
    },
    {
      title: "New Messages",
      value: analytics.totalMessages || 0,
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600">Welcome to the admin dashboard. Here's a summary of your platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to the admin dashboard. Here's a summary of your platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Recent Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booksLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : books.length > 0 ? (
                  books.slice(0, 3).map((book) => (
                    <div key={book.id} className="flex items-center space-x-3">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{book.title}</p>
                        <p className="text-xs text-gray-500">
                          {book.status || 'published'} • {book.createdAt ? new Date(book.createdAt.toDate()).toLocaleDateString() : 'No date'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No books found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">No messages received yet</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}