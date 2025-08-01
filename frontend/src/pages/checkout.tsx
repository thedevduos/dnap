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
import { CreditCard, Truck, MapPin, Mail, Edit, Trash2, Plus } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useUser } from "@/contexts/user-context"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { validateCoupon } from "@/lib/firebase-utils"
import { Badge } from "@/components/ui/badge"
import { AddressModal } from "@/components/profile/address-modal"

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
  const { userProfile, addAddress, removeAddress, isAdmin } = useUser()
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
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discount, setDiscount] = useState(0)
  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [loadingShipping, setLoadingShipping] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
    }
    loadShippingMethods()
    
    // Cleanup function to clear stored order data when component unmounts
    return () => {
      // Only clear if we're not in the middle of a payment process
      if (!processing) {
        sessionStorage.removeItem('pendingOrderData')
      }
    }
  }, [items, navigate, processing])

  useEffect(() => {
    if (userProfile) {
      // Show address form only if no addresses exist
      setShowAddressForm(userProfile.addresses.length === 0)
      
      const defaultAddress = userProfile.addresses.find(addr => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
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

  const loadShippingMethods = async () => {
    try {
      const q = query(collection(db, "shippingMethods"), where("status", "==", "active"))
      const querySnapshot = await getDocs(q)
      const methods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setShippingMethods(methods)
      
      // Set default shipping method if available
      if (methods.length > 0) {
        setFormData(prev => ({ ...prev, shippingMethod: methods[0].id }))
      }
    } catch (error) {
      console.error("Error loading shipping methods:", error)
    } finally {
      setLoadingShipping(false)
    }
  }

  // Calculate shipping based on selected method
  const selectedShippingMethod = shippingMethods.find(m => m.id === formData.shippingMethod)
  const shipping = selectedShippingMethod ? selectedShippingMethod.price : 0
  const tax = Math.round(getTotalPrice() * 0.18)
  const finalTotal = getTotalPrice() + shipping + tax - discount

  const handleInputChange = (field: keyof CheckoutForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressSelect = (address: any) => {
    setSelectedAddressId(address.id)
    setFormData(prev => ({
      ...prev,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    }))
  }

  const handleEditAddress = (address: any) => {
    setEditingAddress(address)
    setAddressModalOpen(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await removeAddress(addressId)
      toast({
        title: "Address Deleted",
        description: "Address has been removed successfully.",
      })
      
      // If this was the selected address, clear the form
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null)
        setFormData(prev => ({
          ...prev,
          firstName: '',
          lastName: '',
          phone: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India'
        }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddNewAddress = () => {
    setEditingAddress(null)
    setAddressModalOpen(true)
  }

  const handleAddressModalClose = () => {
    setAddressModalOpen(false)
    setEditingAddress(null)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    try {
      const result = await validateCoupon(couponCode, getTotalPrice(), user?.uid)
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
    
    if (shippingMethods.length === 0) {
      toast({
        title: "Shipping Not Available",
        description: "Shipping methods are not configured yet. Please contact admin.",
        variant: "destructive"
      })
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (processing || paymentProcessing) {
      console.log('Form submission already in progress, ignoring...')
      return
    }
    
    // Prevent admins from making purchases
    if (isAdmin) {
      toast({
        title: "Purchase Not Allowed",
        description: "Admin users are not allowed to make purchases. Please use a customer account.",
        variant: "destructive"
      })
      return
    }
    
    if (!validateForm()) return
    
    if (shippingMethods.length === 0) {
      toast({
        title: "Cannot Place Order",
        description: "Shipping methods are not configured. Please contact support.",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    setPaymentProcessing(true)
    console.log('Starting checkout process...')

    try {
      // Save address first if user is logged in and wants to save it
      if (user && formData.saveAddress) {
        console.log('Saving address to user profile before payment...')
        try {
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
          console.log('Address saved successfully before payment')
          
          toast({
            title: "Address Saved",
            description: "Your address has been saved for future orders.",
          })
        } catch (error) {
          console.error('Failed to save address before payment:', error)
          toast({
            title: "Address Save Failed",
            description: "Failed to save address, but continuing with payment.",
            variant: "destructive"
          })
          // Continue with payment even if address save fails
        }
      }

      // For PayU, we don't create the order in DB until payment is successful
      if (formData.paymentMethod === 'payu') {
        console.log('Creating PayU payment request...')
        
        // Create a temporary order ID for the payment request
        const tempOrderId = `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const paymentResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/create-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: tempOrderId,
            amount: finalTotal,
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            productInfo: `DNA Publications - ${items.length} books`
          }),
        })

        const paymentResult = await paymentResponse.json()
        console.log('Payment response:', paymentResult)
        
        if (paymentResult.success) {
          console.log('Payment request successful, redirecting to PayU...')
          
          // Store order data in sessionStorage for payment success page
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
            shippingMethodDetails: selectedShippingMethod ? {
              name: selectedShippingMethod.name,
              price: selectedShippingMethod.price,
              deliveryTime: selectedShippingMethod.deliveryTime
            } : null,
            appliedCoupon: appliedCoupon ? {
              code: appliedCoupon.code,
              discountAmount: discount
            } : null,
            discount: discount,
            status: 'pending',
            userEmail: formData.email,
            saveAddress: false // Already saved above, so set to false
          }
          
          sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData))
          
          // Show loading message
          toast({
            title: "Redirecting to Payment Gateway",
            description: "Please wait while we redirect you to PayU...",
          })
          
          // Create form and submit to PayU with a small delay to show the toast
          setTimeout(() => {
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
          }, 1500)
          
          // Add a timeout in case PayU doesn't respond
          setTimeout(() => {
            if (paymentProcessing) {
              setPaymentProcessing(false)
              toast({
                title: "Payment Gateway Timeout",
                description: "The payment gateway is taking longer than expected. Please try again.",
                variant: "destructive"
              })
            }
          }, 30000) // 30 seconds timeout
        } else {
          console.error('Payment request failed:', paymentResult)
          throw new Error('Failed to create payment request')
        }
      } else {
        // For demo purposes with other payment methods
        const demoOrderId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setTimeout(() => {
          clearCart()
          navigate(`/order-confirmation/${demoOrderId}`)
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
      setPaymentProcessing(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Loading Overlay */}
      {paymentProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Redirecting to Payment Gateway</h3>
            <p className="text-muted-foreground">Please wait while we redirect you to PayU...</p>
            <p className="text-sm text-muted-foreground mt-2">Do not close this window or refresh the page.</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Admin restriction notice */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Admin Access Restricted
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Admin users are not allowed to make purchases. Please use a customer account to complete your order.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={paymentProcessing ? 'pointer-events-none opacity-50' : ''}>
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
                  {/* Address Selection for logged-in users */}
                  {user && userProfile && userProfile.addresses.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-medium">Select Address</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddNewAddress}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add New
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {userProfile.addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`p-4 border rounded-lg transition-colors ${
                              selectedAddressId === address.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => handleAddressSelect(address)}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium">{address.firstName} {address.lastName}</p>
                                  {address.isDefault && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{address.address1}</p>
                                {address.address2 && (
                                  <p className="text-sm text-muted-foreground">{address.address2}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state} {address.postalCode}
                                </p>
                                <p className="text-sm text-muted-foreground">{address.country}</p>
                                {address.phone && (
                                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAddress(address)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  )}

                  {/* Address Form - Only show if no addresses exist or user wants to add new */}
                  {showAddressForm && (
                    <div className="space-y-4">
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
                  {loadingShipping ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading shipping methods...</p>
                    </div>
                  ) : shippingMethods.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
                      <Truck className="h-12 w-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-red-800 mb-2">No Shipping Methods Available</h3>
                      <p className="text-red-600 mb-4">
                        Shipping methods have not been configured yet. Please contact the administrator to set up delivery options.
                      </p>
                      <p className="text-sm text-red-500">
                        You cannot place an order until shipping methods are available.
                      </p>
                    </div>
                  ) : (
                    <RadioGroup
                      value={formData.shippingMethod}
                      onValueChange={(value) => handleInputChange('shippingMethod', value)}
                    >
                      {shippingMethods.map((method) => (
                        <div key={method.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-sm text-muted-foreground">{method.deliveryTime}</p>
                                {method.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{method.description}</p>
                                )}
                              </div>
                              <p className="font-medium">
                                {method.price === 0 ? 'Free' : `₹${method.price}`}
                              </p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
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

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full" 
                    disabled={processing || paymentProcessing || isAdmin}
                  >
                    {processing || paymentProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {paymentProcessing ? "Redirecting to Payment Gateway..." : "Processing..."}
                      </div>
                    ) : isAdmin ? (
                      "Admin Cannot Purchase"
                    ) : shippingMethods.length === 0 ? (
                      "Shipping Not Available"
                    ) : (
                      `Pay ₹${finalTotal}`
                    )}
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

      {/* Address Modal */}
      <AddressModal
        open={addressModalOpen}
        onOpenChange={handleAddressModalClose}
        address={editingAddress}
      />
    </div>
  )
}