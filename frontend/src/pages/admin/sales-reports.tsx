"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
  BarChart, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Users,
  Calendar,
  Download
} from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { collection, query, getDocs, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminSalesReports() {
  const [salesData, setSalesData] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedAuthor, setSelectedAuthor] = useState("all")
  const [selectedBook, setSelectedBook] = useState("all")
  const { toast } = useToast()

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())
  const months = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ]

  useEffect(() => {
    loadData()
  }, [selectedYear, selectedMonth, selectedAuthor, selectedBook])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load orders - include both confirmed and delivered orders
      const ordersQuery = query(
        collection(db, "orders"),
        where("status", "in", ["delivered", "confirmed"]),
        orderBy("createdAt", "desc")
      )
      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Load authors
      const authorsQuery = query(collection(db, "authors"))
      const authorsSnapshot = await getDocs(authorsQuery)
      const authorsData = authorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAuthors(authorsData)

      // Load books
      const booksQuery = query(collection(db, "books"))
      const booksSnapshot = await getDocs(booksQuery)
      const booksData = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setBooks(booksData)

      // Process sales data
      const processedData = processSalesData(orders, booksData)
      setSalesData(processedData)
    } catch (error) {
      console.error("Error loading sales data:", error)
      toast({
        title: "Error",
        description: "Failed to load sales data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const processSalesData = (orders: any[], books: any[]) => {
    const salesMap = new Map()

    orders.forEach(order => {
      const orderDate = order.createdAt?.toDate()
      if (!orderDate) return

      const year = orderDate.getFullYear()
      const month = orderDate.getMonth() + 1

      // Filter by selected criteria
      if (year.toString() !== selectedYear) return
      if (selectedMonth !== "all" && month.toString() !== selectedMonth) return

      order.items?.forEach((item: any) => {
        const book = books.find(b => b.id === item.bookId)
        if (!book) return

        // Filter by selected author
        if (selectedAuthor !== "all" && book.authorId !== selectedAuthor) return
        // Filter by selected book
        if (selectedBook !== "all" && book.id !== selectedBook) return

        const key = `${year}-${month}-${item.bookId}`
        
        if (!salesMap.has(key)) {
          salesMap.set(key, {
            year,
            month,
            bookId: item.bookId,
            bookTitle: item.title,
            authorId: book.authorId,
            authorName: book.author,
            totalSales: 0,
            totalRevenue: 0,
            affiliateSales: 0,
            affiliateRevenue: 0,
            regularSales: 0,
            regularRevenue: 0
          })
        }

        const entry = salesMap.get(key)
        entry.totalSales += item.quantity
        entry.totalRevenue += item.price * item.quantity

        if (order.affiliateCode) {
          entry.affiliateSales += item.quantity
          entry.affiliateRevenue += item.price * item.quantity
        } else {
          entry.regularSales += item.quantity
          entry.regularRevenue += item.price * item.quantity
        }
      })
    })

    return Array.from(salesMap.values())
  }



  const getAuthorEmail = (authorId: string) => {
    const author = authors.find(a => a.uid === authorId)
    return author?.email || "Unknown"
  }

  // Calculate totals
  const totalSales = salesData.reduce((sum, item) => sum + item.totalSales, 0)
  const totalRevenue = salesData.reduce((sum, item) => sum + item.totalRevenue, 0)
  const affiliateSales = salesData.reduce((sum, item) => sum + item.affiliateSales, 0)
  const affiliateRevenue = salesData.reduce((sum, item) => sum + item.affiliateRevenue, 0)
  const regularSales = salesData.reduce((sum, item) => sum + item.regularSales, 0)
  const regularRevenue = salesData.reduce((sum, item) => sum + item.regularRevenue, 0)

  const handleExportData = () => {
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${selectedYear}-${selectedMonth}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Export Successful",
      description: "Sales report has been downloaded.",
    })
  }

  const generateCSV = () => {
    const headers = ['Year', 'Month', 'Book', 'Author', 'Total Sales', 'Total Revenue', 'Affiliate Sales', 'Affiliate Revenue', 'Regular Sales', 'Regular Revenue']
    const rows = salesData.map(item => [
      item.year,
      months.find(m => m.value === item.month.toString())?.label || item.month,
      item.bookTitle,
      item.authorName,
      item.totalSales,
      item.totalRevenue,
      item.affiliateSales,
      item.affiliateRevenue,
      item.regularSales,
      item.regularRevenue
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
            <p className="text-gray-600">Comprehensive sales analytics and reporting</p>
          </div>
          <Button onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
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
              
              <div>
                <label className="text-sm font-medium mb-2 block">Month</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Author</label>
                <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authors</SelectItem>
                    {authors.map(author => (
                      <SelectItem key={author.uid} value={author.uid}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Book</label>
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Books</SelectItem>
                    {books.map(book => (
                      <SelectItem key={book.id} value={book.id}>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
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
                <DollarSign className="h-8 w-8 text-green-600" />
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
                <Users className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Regular Sales</p>
                  <p className="text-2xl font-bold">{regularSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-teal-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Regular Revenue</p>
                  <p className="text-2xl font-bold">₹{regularRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Sales Report ({salesData.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading sales data...</p>
              </div>
            ) : salesData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No sales data found for the selected criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Affiliate Sales</TableHead>
                      <TableHead className="text-right">Affiliate Revenue</TableHead>
                      <TableHead className="text-right">Regular Sales</TableHead>
                      <TableHead className="text-right">Regular Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {months.find(m => m.value === item.month.toString())?.label} {item.year}
                        </TableCell>
                        <TableCell className="font-medium">{item.bookTitle}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.authorName}</div>
                            <div className="text-sm text-muted-foreground">{getAuthorEmail(item.authorId)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.totalSales}</TableCell>
                        <TableCell className="text-right">₹{item.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.affiliateSales}</TableCell>
                        <TableCell className="text-right">₹{item.affiliateRevenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.regularSales}</TableCell>
                        <TableCell className="text-right">₹{item.regularRevenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
} 