"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  IndianRupee, 
  ShoppingCart,
  Download,
  TrendingUp
} from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { collection, query, getDocs, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { exportToExcel } from "@/lib/excel-utils"

export default function AdminRoyalty() {
  const [salesData, setSalesData] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const { toast } = useToast()

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())
  const months = [
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
  }, [selectedYear, selectedMonth])

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
      if (month.toString() !== selectedMonth) return

      order.items?.forEach((item: any) => {
        const book = books.find(b => b.id === item.bookId)
        if (!book) return

        const key = `${orderDate.toISOString().split('T')[0]}-${item.bookId}`
        
        if (!salesMap.has(key)) {
          salesMap.set(key, {
            date: orderDate.toISOString().split('T')[0],
            year,
            month,
            bookId: item.bookId,
            bookTitle: item.title,
            authorId: book.authorId,
            authorName: book.author,
            authorEmail: getAuthorEmail(book.authorId),
            royaltyPercentage: book.royaltyPercentage || 0,
            totalSales: 0,
            totalRevenue: 0,
            affiliateSales: 0,
            affiliateRevenue: 0,
            regularSales: 0,
            regularRevenue: 0,
            royaltyAmount: 0
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

        // Calculate royalty amount
        entry.royaltyAmount = (entry.totalRevenue * entry.royaltyPercentage) / 100
      })
    })

    return Array.from(salesMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getAuthorEmail = (authorId: string) => {
    const author = authors.find(a => a.uid === authorId)
    return author?.email || "Unknown"
  }

  // Calculate totals
  const totalSales = salesData.reduce((sum, item) => sum + item.totalSales, 0)
  const totalRevenue = salesData.reduce((sum, item) => sum + item.totalRevenue, 0)
  const totalRoyaltyAmount = salesData.reduce((sum, item) => sum + item.royaltyAmount, 0)

  // Group by author for author-wise data
  const authorWiseData = salesData.reduce((acc: any, item) => {
    const key = item.authorId
    if (!acc[key]) {
      acc[key] = {
        authorId: item.authorId,
        authorName: item.authorName,
        authorEmail: item.authorEmail,
        totalSales: 0,
        totalRevenue: 0,
        totalRoyaltyAmount: 0
      }
    }
    acc[key].totalSales += item.totalSales
    acc[key].totalRevenue += item.totalRevenue
    acc[key].totalRoyaltyAmount += item.royaltyAmount
    return acc
  }, {})

  const authorWiseArray = Object.values(authorWiseData)

  const handleExportSalesList = async () => {
    try {
      const exportData = salesData.map(item => ({
        'Date': item.date,
        'Book': item.bookTitle,
        'Author': item.authorName,
        'Author Email': item.authorEmail,
        'Total Sales': item.totalSales,
        'Total Revenue': item.totalRevenue,
        'Affiliate Sales': item.affiliateSales,
        'Affiliate Revenue': item.affiliateRevenue,
        'Regular Sales': item.regularSales,
        'Regular Revenue': item.regularRevenue,
        'Royalty Percentage': item.royaltyPercentage,
        'Royalty Amount': item.royaltyAmount
      }))
      
      await exportToExcel(exportData, `royalty-sales-list-${selectedYear}-${selectedMonth}`)
      
      toast({
        title: "Export Successful",
        description: "Sales list has been exported to Excel.",
      })
    } catch (error) {
      console.error("Error exporting sales list:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export sales list.",
        variant: "destructive"
      })
    }
  }

  const handleExportAuthorWise = async () => {
    try {
      const exportData = authorWiseArray.map((item: any) => ({
        'Author Name': item.authorName,
        'Author Email': item.authorEmail,
        'Total Sales': item.totalSales,
        'Total Revenue': item.totalRevenue,
        'Total Royalty Amount': item.totalRoyaltyAmount
      }))
      
      await exportToExcel(exportData, `royalty-author-wise-${selectedYear}-${selectedMonth}`)
      
      toast({
        title: "Export Successful",
        description: "Author-wise data has been exported to Excel.",
      })
    } catch (error) {
      console.error("Error exporting author-wise data:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export author-wise data.",
        variant: "destructive"
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Royalty Management</h1>
            <p className="text-gray-600">Track and manage author royalty payments</p>
          </div>
        </div>

        {/* Year and Month Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Analytics Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <TrendingUp className="h-8 w-8 text-green-600" />
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
                <IndianRupee className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Royalty Amount</p>
                  <p className="text-2xl font-bold">₹{totalRoyaltyAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales-list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales-list">Sales List</TabsTrigger>
            <TabsTrigger value="author-wise">Author Wise Data</TabsTrigger>
          </TabsList>

          <TabsContent value="sales-list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sales List ({salesData.length} entries)</CardTitle>
                  <Button onClick={handleExportSalesList}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading sales data...</p>
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sales data found for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Book</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead className="text-right">Total Sales</TableHead>
                          <TableHead className="text-right">Total Revenue</TableHead>
                          <TableHead className="text-right">Affiliate Sales</TableHead>
                          <TableHead className="text-right">Affiliate Revenue</TableHead>
                          <TableHead className="text-right">Regular Sales</TableHead>
                          <TableHead className="text-right">Regular Revenue</TableHead>
                          <TableHead className="text-right">Royalty %</TableHead>
                          <TableHead className="text-right">Royalty Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(item.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">{item.bookTitle}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.authorName}</div>
                                <div className="text-sm text-muted-foreground">{item.authorEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.totalSales}</TableCell>
                            <TableCell className="text-right">₹{item.totalRevenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.affiliateSales}</TableCell>
                            <TableCell className="text-right">₹{item.affiliateRevenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.regularSales}</TableCell>
                            <TableCell className="text-right">₹{item.regularRevenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{Math.round((item.royaltyPercentage || 0) * 100) / 100}%</TableCell>
                            <TableCell className="text-right font-medium">₹{item.royaltyAmount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="author-wise" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Author Wise Data ({authorWiseArray.length} authors)</CardTitle>
                  <Button onClick={handleExportAuthorWise}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading author data...</p>
                  </div>
                ) : authorWiseArray.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No author data found for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Author Name</TableHead>
                          <TableHead>Author Email</TableHead>
                          <TableHead className="text-right">Total Sales</TableHead>
                          <TableHead className="text-right">Total Revenue</TableHead>
                          <TableHead className="text-right">Total Royalty Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {authorWiseArray.map((item: any, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.authorName}</TableCell>
                            <TableCell>{item.authorEmail}</TableCell>
                            <TableCell className="text-right">{item.totalSales}</TableCell>
                            <TableCell className="text-right">₹{item.totalRevenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.totalRoyaltyAmount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
