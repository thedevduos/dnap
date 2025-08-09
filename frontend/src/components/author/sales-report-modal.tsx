"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, TrendingUp, DollarSign, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getAuthorSalesReport } from "@/lib/author-utils"

interface SalesReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: any
}

export function SalesReportModal({ open, onOpenChange, book }: SalesReportModalProps) {
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const { user } = useAuth()

  useEffect(() => {
    if (open && user) {
      loadSalesData()
    }
  }, [open, user, selectedYear, book])

  const loadSalesData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await getAuthorSalesReport(user.uid, book?.assignedBookId)
      const filteredData = data.filter((item: any) => item.year.toString() === selectedYear)
      setSalesData(filteredData)
    } catch (error) {
      console.error("Error loading sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalSales = salesData.reduce((sum, item) => sum + item.totalSales, 0)
  const totalRevenue = salesData.reduce((sum, item) => sum + item.totalRevenue, 0)
  const affiliateSales = salesData.reduce((sum, item) => sum + item.affiliateSales, 0)
  const affiliateRevenue = salesData.reduce((sum, item) => sum + item.affiliateRevenue, 0)

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Sales Report {book ? `- ${book.title}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Year Filter */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sales Performance</h3>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2023, 2022].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BarChart className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold">{totalSales}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{totalRevenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Affiliate Sales</p>
                    <p className="text-2xl font-bold">{affiliateSales}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Affiliate Revenue</p>
                    <p className="text-2xl font-bold">₹{affiliateRevenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : salesData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No sales data available for {selectedYear}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {months.map((month, index) => {
                    const monthData = salesData.find(item => item.month === index + 1)
                    return (
                      <div key={month} className="flex justify-between items-center p-3 border rounded-lg">
                        <span className="font-medium">{month}</span>
                        <div className="flex gap-4 text-sm">
                          <span>Sales: {monthData?.totalSales || 0}</span>
                          <span>Revenue: ₹{monthData?.totalRevenue || 0}</span>
                          <span>Affiliate: {monthData?.affiliateSales || 0}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}