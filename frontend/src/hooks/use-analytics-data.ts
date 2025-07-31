"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useAnalyticsData(dateRange: string) {
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const days = parseInt(dateRange)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Fetch orders
        const ordersQuery = query(
          collection(db, "orders"),
          where("createdAt", ">=", startDate),
          orderBy("createdAt", "desc")
        )
        const ordersSnapshot = await getDocs(ordersQuery)
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

        // Fetch customers
        const customersQuery = query(
          collection(db, "userProfiles"),
          where("createdAt", ">=", startDate)
        )
        const customersSnapshot = await getDocs(customersQuery)

        // Calculate analytics
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
        const totalOrders = orders.length
        const newCustomers = customersSnapshot.size

        // Calculate conversion rate (simplified)
        const conversionRate = totalOrders > 0 ? ((totalOrders / (newCustomers || 1)) * 100).toFixed(1) : 0

        // Top products (simplified)
        const productSales: { [key: string]: any } = {}
        orders.forEach(order => {
          order.items?.forEach((item: any) => {
            if (!productSales[item.bookId]) {
              productSales[item.bookId] = {
                ...item,
                soldCount: 0,
                revenue: 0
              }
            }
            productSales[item.bookId].soldCount += item.quantity
            productSales[item.bookId].revenue += item.price * item.quantity
          })
        })

        const topProducts = Object.values(productSales)
          .sort((a: any, b: any) => b.soldCount - a.soldCount)
          .slice(0, 5)

        // Recent activity
        const recentActivity = [
          ...orders.slice(0, 3).map(order => ({
            type: 'order',
            description: `New order #${order.id.slice(-8)}`,
            time: order.createdAt?.toDate().toLocaleString()
          })),
          ...customersSnapshot.docs.slice(0, 2).map(doc => {
            const customer = doc.data()
            return {
              type: 'customer',
              description: `New customer: ${customer.displayName || customer.email}`,
              time: customer.createdAt?.toDate().toLocaleString()
            }
          })
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

        setAnalytics({
          totalRevenue,
          totalOrders,
          newCustomers,
          conversionRate,
          topProducts,
          recentActivity
        })

      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [dateRange])

  return { analytics, loading }
}