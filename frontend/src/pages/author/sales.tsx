"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, TrendingUp, IndianRupee, ShoppingCart } from "lucide-react"
import { useAuthorBooks } from "@/hooks/use-author-books"
import { useAuth } from "@/contexts/auth-context"
import { AuthorLayout } from "@/components/author/author-layout"
import { getAuthorSalesReport } from "@/lib/author-utils"
import React, { useMemo, useCallback } from "react"

export default function AuthorSalesPage() {
  const { books } = useAuthorBooks()
  const { user } = useAuth()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedBook, setSelectedBook] = useState<string>("all")
  const [salesData, setSalesData] = useState<any[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  // Use useMemo to prevent unnecessary re-renders
  const completedBooks = useMemo(() => 
    books.filter(book => book.stage === 'completed'), 
    [books]
  )
  
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  const loadSalesData = useCallback(async () => {
    if (!user) return
    
    setLoadingSales(true)
    try {
      const data = await getAuthorSalesReport(user.uid, selectedBook === "all" ? undefined : selectedBook)
      const filteredData = data.filter((item: any) => item.year.toString() === selectedYear)
      setSalesData(filteredData)
    } catch (error) {
      console.error("Error loading sales data:", error)
    } finally {
      setLoadingSales(false)
    }
  }, [user?.uid, selectedBook, selectedYear])

  // Load sales data when filters change
  React.useEffect(() => {
    if (user && completedBooks.length > 0) {
      loadSalesData()
    }
  }, [user?.uid, selectedYear, selectedBook, completedBooks.length, loadSalesData]) // Include loadSalesData in dependencies

  const totalSales = salesData.reduce((sum, item) => sum + item.totalSales, 0)
  const totalRevenue = salesData.reduce((sum, item) => sum + item.totalRevenue, 0)
  const affiliateSales = salesData.reduce((sum, item) => sum + item.affiliateSales, 0)
  const affiliateRevenue = salesData.reduce((sum, item) => sum + item.affiliateRevenue, 0)
  const totalRoyaltyAmount = salesData.reduce((sum, item) => sum + (item.royaltyAmount || 0), 0)

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <AuthorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600">Track your book sales and revenue</p>
        </div>

        {completedBooks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No published books found</p>
              <p className="text-sm text-gray-500 mt-2">Sales data will appear here once your books are published</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Book</label>
                    <Select value={selectedBook} onValueChange={setSelectedBook}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Books</SelectItem>
                        {completedBooks.map(book => (
                          <SelectItem key={book.id} value={book.assignedBookId || book.id}>
                            {book.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold">{totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <IndianRupee className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Affiliate Sales</p>
                      <p className="text-2xl font-bold">{affiliateSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Affiliate Revenue</p>
                      <p className="text-2xl font-bold">₹{affiliateRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <IndianRupee className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Your Royalty</p>
                      <p className="text-2xl font-bold">₹{totalRoyaltyAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Sales Report</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSales ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading sales data...</p>
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sales data found for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Month</th>
                          <th className="text-left py-3 px-4 font-medium">Book</th>
                          <th className="text-right py-3 px-4 font-medium">Total Sales</th>
                          <th className="text-right py-3 px-4 font-medium">Total Revenue</th>
                          <th className="text-right py-3 px-4 font-medium">Affiliate Sales</th>
                          <th className="text-right py-3 px-4 font-medium">Affiliate Revenue</th>
                          <th className="text-right py-3 px-4 font-medium">Regular Sales</th>
                          <th className="text-right py-3 px-4 font-medium">Regular Revenue</th>
                          <th className="text-right py-3 px-4 font-medium">Royalty %</th>
                          <th className="text-right py-3 px-4 font-medium">Royalty Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{months[item.month - 1]}</td>
                            <td className="py-3 px-4">{item.bookTitle}</td>
                            <td className="py-3 px-4 text-right">{item.totalSales}</td>
                            <td className="py-3 px-4 text-right">₹{item.totalRevenue.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">{item.affiliateSales}</td>
                            <td className="py-3 px-4 text-right">₹{item.affiliateRevenue.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">{item.totalSales - item.affiliateSales}</td>
                            <td className="py-3 px-4 text-right">₹{(item.totalRevenue - item.affiliateRevenue).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">{Math.round((item.royaltyPercentage || 0) * 100) / 100}%</td>
                            <td className="py-3 px-4 text-right font-medium">₹{(item.royaltyAmount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthorLayout>
  )
} 