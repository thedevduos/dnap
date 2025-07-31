"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Truck, MapPin, User, Phone, Mail } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useUser } from "@/contexts/user-context"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateCoupon, applyCoupon } from "@/lib/firebase-utils"

interface CheckoutForm {
  email: string
  firstName: string
  lastName: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  paymentMethod: string
  shippingMethod: string
  saveAddress: boolean
}

export default function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCart()
  const { userProfile, addAddress } = useUser()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [formData, setFormData] = useState<CheckoutForm>({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    paymentMethod: 'payu',
    shippingMethod: 'standard',
    saveAddress: false
  })

  const [processing, setProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
    }
  }, [items, navigate])

  useEffect(() => {
    if (userProfile) {
      const defaultAddress = userProfile.addresses.find(addr => addr.isDefault)
      if (defaultAddress) {
        setFormData(prev => ({
          ...prev,
          firstName: defaultAddress.firstName,
          lastName: defaultAddress.lastName,
          phone: defaultAddress.phone || '',
          address1: defaultAddress.address1,
          address2: defaultAddress.address2 || '',
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.postalCode,
          country: defaultAddress.country
        }))
      }
    }
  }, [userProfile])

  const shipping = getTotalPrice() > 500 ? 0 : 50
  const tax = Math.round(getTotalPrice() * 0.18)
  const finalTotal = getTotalPrice() + shipping + tax - discount

  const handleInputChange = (field: keyof CheckoutForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    try {
      const result = await validateCoupon(couponCode, getTotalPrice())
      setAppliedCoupon(result.coupon)
      setDiscount(result.discountAmount)
      toast({
        title: "Coupon Applied!",
        description: `You saved ₹${result.discountAmount}`,
      })
    } catch (error: any) {
      toast({
        title: "Invalid Coupon",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setDiscount(0)
    setCouponCode("")
  }

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'phone', 'address1', 'city', 'state', 'postalCode']
    for (const field of required) {
      if (!formData[field as keyof CheckoutForm]) {
        toast({
          title: "Missing Information",
          description: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive"
        })
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setProcessing(true)

    try {
      // Create order in database
      const orderData = {
        userId: user?.uid || null,
        items: items.map(item => ({
          bookId: item.id,
          title: item.title,
          author: item.author,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        subtotal: getTotalPrice(),
        shipping: shipping,
        tax: tax,
        total: finalTotal,
        paymentMethod: formData.paymentMethod,
        shippingMethod: formData.shippingMethod,
        appliedCoupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discountAmount: discount
        } : null,
        discount: discount,
        status: 'pending',
        userEmail: formData.email,
        createdAt: serverTimestamp()
      }

      const orderRef = await addDoc(collection(db, "orders"), orderData)

      // Apply coupon usage
      if (appliedCoupon) {
        await applyCoupon(appliedCoupon.id)
      }

      // Save address if requested
      if (formData.saveAddress && user) {
        await addAddress({
          type: 'home',
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          isDefault: userProfile?.addresses.length === 0
        })
      }

      // Create payment request
      if (formData.paymentMethod === 'payu') {
        const paymentResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/create-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderRef.id,
            amount: finalTotal,
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            productInfo: `DNA Publications - ${items.length} books`
          }),
        })

        const paymentResult = await paymentResponse.json()
        
        if (paymentResult.success) {
          // Create form and submit to PayU
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = paymentResult.paymentUrl
          
          Object.keys(paymentResult.params).forEach(key => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = paymentResult.params[key]
            form.appendChild(input)
          })
          
          document.body.appendChild(form)
          form.submit()
        } else {
          throw new Error('Failed to create payment request')
        }
      } else {
        // For demo purposes with other payment methods
        setTimeout(() => {
          clearCart()
          navigate(`/order-confirmation/${orderRef.id}`)
          toast({
            title: "Order Placed!",
            description: "Your order has been placed successfully.",
          })
        }, 2000)
      }

    } catch (error: any) {
      console.error('Checkout error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process order. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
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
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address1">Address Line 1 *</Label>
                    <Input
                      id="address1"
                      value={formData.address1}
                      onChange={(e) => handleInputChange('address1', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input
                      id="address2"
                      value={formData.address2}
                      onChange={(e) => handleInputChange('address2', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {user && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveAddress"
                        checked={formData.saveAddress}
                        onCheckedChange={(checked) => handleInputChange('saveAddress', checked as boolean)}
                      />
                      <Label htmlFor="saveAddress">Save this address for future orders</Label>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.shippingMethod}
                    onValueChange={(value) => handleInputChange('shippingMethod', value)}
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">Standard Shipping</p>
                            <p className="text-sm text-muted-foreground">5-7 business days</p>
                          </div>
                          <p className="font-medium">{shipping === 0 ? 'Free' : `₹${shipping}`}</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">Express Shipping</p>
                            <p className="text-sm text-muted-foreground">2-3 business days</p>
                          </div>
                          <p className="font-medium">₹100</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
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
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="payu" id="payu" />
                      <Label htmlFor="payu" className="flex-1">
                        <div>
                          <p className="font-medium">PayU Payment Gateway</p>
                          <p className="text-sm text-muted-foreground">
                            Pay securely with credit card, debit card, net banking, or UPI
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                      <RadioGroupItem value="cod" id="cod" disabled />
                      <Label htmlFor="cod" className="flex-1">
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Currently unavailable</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-12 h-16 flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <Label>Coupon Code</Label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                          <p className="text-sm text-green-600">Saved ₹{discount}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-green-600 hover:text-green-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({getTotalItems()} items)</span>
                      <span>₹{getTotalPrice()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (GST 18%)</span>
                      <span>₹{tax}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{finalTotal}</span>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={processing}>
                    {processing ? "Processing..." : `Pay ₹${finalTotal}`}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}