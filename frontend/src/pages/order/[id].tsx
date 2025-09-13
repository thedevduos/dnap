"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, Truck, MapPin, CreditCard, Phone, Mail } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      loadOrderDetails()
    }
  }, [id])

  const loadOrderDetails = async () => {
    try {
      const orderDoc = await getDoc(doc(db, "orders", id!))
      if (orderDoc.exists()) {
        const orderData = { id: orderDoc.id, ...orderDoc.data() }
        setOrder(orderData)
      }
    } catch (error) {
      console.error("Error loading order:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "shipped": return "bg-purple-100 text-purple-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: Package },
      { key: "confirmed", label: "Confirmed", icon: Package },
      { key: "shipped", label: "Shipped", icon: Truck },
      { key: "delivered", label: "Delivered", icon: Package },
    ]

    const statusOrder = ["pending", "confirmed", "shipped", "delivered"]
    const currentIndex = statusOrder.indexOf(currentStatus)

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order || order.userId !== user?.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Link to="/profile">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statusSteps = getStatusSteps(order.status)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link to="/profile" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">Order {order.orderNumber || `#${order.id.slice(-8)}`}</h1>
                <p className="text-muted-foreground">
                  Placed on {order.createdAt?.toDate().toLocaleDateString()}
                </p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
          </div>

          {/* Order Status Timeline */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <p className={`text-sm mt-2 text-center ${
                      step.completed ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </p>
                    {index < statusSteps.length - 1 && (
                      <div className={`h-0.5 w-full mt-5 ${
                        step.completed ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-16 h-20 flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">by {item.author}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm">Qty: {item.quantity}</span>
                            <span className="font-medium">₹{item.price * item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary & Details */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span>
                  </div>

                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && (
                      <p className="flex items-center mt-2">
                        <Phone className="h-4 w-4 mr-2" />
                        {order.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {order.paymentMethod === 'razorpay' ? 'Razorpay' :
                 order.paymentMethod === 'zoho' ? 'Zoho Pay' :
                 order.paymentMethod}
                  </p>
                  {order.transactionId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Transaction ID: {order.transactionId}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contact Support */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      Track Package
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}