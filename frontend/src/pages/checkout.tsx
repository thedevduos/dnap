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
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { validateCoupon } from "@/lib/firebase-utils"
import { Badge } from "@/components/ui/badge"
import { AddressModal } from "@/components/profile/address-modal"
import { 
  handleRazorpayPayment, 
  handleZohoPayment,
  getPaymentMethodDisplayName,
  getPaymentMethodDescription,
  storeOrderData,
  clearOrderData
} from "@/lib/payment-utils"
import { getPincodeData, isValidPincode } from "@/lib/pincode-utils"
import { useShippingRates } from "@/hooks/use-shipping-rates"
import { calculateShippingRate, calculateCartWeight, DEFAULT_SHIPPING_RATES } from "@/lib/shipping-rates-utils"


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
  const { items, getTotalPrice, getTotalItems, restoreCartFromOrderData } = useCart()
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
    paymentMethod: 'razorpay',
    shippingMethod: 'standard',
    saveAddress: false
  })

  const [processing, setProcessing] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discount, setDiscount] = useState(0)
  const { shippingRates } = useShippingRates()
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)

  // Separate useEffect for restoring cart items from failed payment
  useEffect(() => {
    const storedOrderData = sessionStorage.getItem('pendingOrderData')
    console.log('Checking for stored order data:', !!storedOrderData, 'Cart items:', items.length)
    
    if (storedOrderData && items.length === 0) {
      try {
        const orderData = JSON.parse(storedOrderData)
        console.log('Found stored order data:', orderData)
        
        // Restore cart items if cart is empty (coming from failed payment)
        if (orderData.items && orderData.items.length > 0) {
          console.log('Restoring cart items from stored order data')
          restoreCartFromOrderData(orderData)
        }
      } catch (error) {
        console.error('Error restoring cart items:', error)
      }
    }
  }, [items.length, restoreCartFromOrderData])

  useEffect(() => {
    // Check if we have stored order data from a failed payment
    const storedOrderData = sessionStorage.getItem('pendingOrderData')
    if (storedOrderData) {
      try {
        const orderData = JSON.parse(storedOrderData)
        
        // Restore form data from stored order
        if (orderData.shippingAddress) {
          setFormData(prev => ({
            ...prev,
            email: orderData.userEmail || user?.email || '',
            firstName: orderData.shippingAddress.firstName || '',
            lastName: orderData.shippingAddress.lastName || '',
            phone: orderData.shippingAddress.phone || '',
            address1: orderData.shippingAddress.address1 || '',
            address2: orderData.shippingAddress.address2 || '',
            city: orderData.shippingAddress.city || '',
            state: orderData.shippingAddress.state || '',
            postalCode: orderData.shippingAddress.postalCode || '',
            country: orderData.shippingAddress.country || 'India',
            paymentMethod: orderData.paymentMethod || 'razorpay',
            shippingMethod: orderData.shippingMethod || 'standard'
          }))
        }

        // Restore applied coupon if any
        if (orderData.appliedCoupon) {
          setAppliedCoupon(orderData.appliedCoupon)
          setDiscount(orderData.discount || 0)
        }
      } catch (error) {
        console.error('Error restoring order data:', error)
        // If restoration fails, clear the stored data
        sessionStorage.removeItem('pendingOrderData')
      }
    }
    
    // If no items in cart and no stored data, redirect to cart
    if (items.length === 0) {
      navigate('/cart')
      return
    }

    
    // Cleanup function to clear stored order data when component unmounts
    return () => {
      // Check if payment processing has started
      const paymentProcessingFlag = sessionStorage.getItem('paymentProcessing')
      
      if (!paymentProcessingFlag) {
        console.log('Clearing pendingOrderData on component unmount - no payment processing')
        clearOrderData()
      } else {
        console.log('Keeping pendingOrderData during payment processing')
      }
    }
  }, [items, navigate, processing, user?.email, toast])

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


  // Calculate shipping based on dynamic rates
  const cartWeight = calculateCartWeight(items)
  
  // Use default rates if no rates are configured in database
  const ratesToUse = shippingRates.length > 0 ? shippingRates : DEFAULT_SHIPPING_RATES
  
  const shippingCalculation = calculateShippingRate(
    cartWeight,
    formData.state,
    formData.country,
    ratesToUse
  )
  const shipping = shippingCalculation ? shippingCalculation.rate : 0
  const finalTotal = getTotalPrice() + shipping - discount
  
  // Debug logging
  console.log('Shipping Debug:', {
    cartWeight,
    state: formData.state,
    country: formData.country,
    shippingRatesCount: shippingRates.length,
    ratesToUseCount: ratesToUse.length,
    shippingCalculation
  })

  const handleInputChange = (field: keyof CheckoutForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePincodeChange = async (pincode: string) => {
    setFormData(prev => ({ ...prev, postalCode: pincode }))
    
    if (isValidPincode(pincode)) {
      setPincodeLoading(true)
      try {
        const pincodeData = await getPincodeData(pincode)
        if (pincodeData) {
          setFormData(prev => ({
            ...prev,
            city: pincodeData.city,
            state: pincodeData.state,
            country: pincodeData.country
          }))
          toast({
            title: "Location Updated",
            description: `City: ${pincodeData.city}, State: ${pincodeData.state}`,
          })
        } else {
          toast({
            title: "Invalid Pincode",
            description: "Could not find location for this pincode",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error fetching pincode data:', error)
        toast({
          title: "Error",
          description: "Failed to fetch location data",
          variant: "destructive",
        })
      } finally {
        setPincodeLoading(false)
      }
    }
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
    
    if (!shippingCalculation) {
      toast({
        title: "Cannot Place Order",
        description: "Please enter a valid pincode and address to calculate shipping charges.",
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

      // Get affiliate information from session storage
      const affiliateRef = sessionStorage.getItem('affiliateRef')
      const affiliateCoupon = sessionStorage.getItem('affiliateCoupon')

      // Calculate totals
      const subtotal = getTotalPrice()
      const shipping = shippingCalculation ? shippingCalculation.rate : 0
      const finalTotal = subtotal + shipping - discount

      // Create temporary order ID
      const tempOrderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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
        total: finalTotal,
        paymentMethod: formData.paymentMethod,
        shippingMethod: 'dynamic',
        shippingMethodDetails: shippingCalculation ? {
          name: 'Dynamic Shipping',
          price: shippingCalculation.rate,
          deliveryTime: '3-7 business days',
          weight: cartWeight,
          region: shippingCalculation.region,
          weightSlab: shippingCalculation.weightSlab
        } : null,
        appliedCoupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discountAmount: discount
        } : null,
        discount: discount,
        status: 'pending',
        userEmail: formData.email,
        saveAddress: false, // Already saved above, so set to false
        // Add affiliate tracking information
        affiliateRef: affiliateRef || null,
        affiliateCoupon: affiliateCoupon || null
      }
      
      storeOrderData(orderData)
      console.log('Order data stored in checkout:', orderData)
      
      // Set a flag to indicate payment processing has started
      sessionStorage.setItem('paymentProcessing', 'true')
      
      // Handle different payment methods
      const paymentData = {
        orderId: tempOrderId,
        amount: finalTotal,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        productInfo: `DNA Publications - ${items.length} books`
      }

      switch (formData.paymentMethod) {
        case 'razorpay':
          console.log('Creating Razorpay payment request...')
          await handleRazorpayPayment(paymentData)
          
          // Show loading message
          toast({
            title: "Opening Payment Gateway",
            description: `Please complete your payment in the ${getPaymentMethodDisplayName('razorpay')} window...`,
          })
          break

        case 'zoho':
          console.log('Creating Zoho Pay payment request...')
          await handleZohoPayment(paymentData)
          
          // Show loading message
          toast({
            title: "Redirecting to Payment Gateway",
            description: `Please complete your payment in the ${getPaymentMethodDisplayName('zoho')} window...`,
          })
          break

        default:
          throw new Error('Unsupported payment method')
      }

    } catch (error: any) {
      console.error('Checkout error:', error)
      
      // Don't clear sessionStorage if it's a payment processing error
      // as the user might be redirected back to success/failure page
      if (!paymentProcessing) {
        clearOrderData()
      }
      
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
            <p className="text-muted-foreground">Please wait while we redirect you to {getPaymentMethodDisplayName(formData.paymentMethod)}...</p>
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

                      <div>
                        <Label htmlFor="postalCode">Pincode *</Label>
                        <div className="relative">
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            placeholder="Enter 6-digit pincode"
                            maxLength={6}
                            required
                          />
                          {pincodeLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">We'll automatically fetch your city and state</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            required
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            required
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
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

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!formData.state || !formData.postalCode ? (
                    <div className="text-center py-8 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50">
                      <Truck className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-orange-800 mb-2">Enter Delivery Address</h3>
                      <p className="text-orange-600 mb-4">
                        Please enter your pincode and address details to calculate shipping charges.
                      </p>
                    </div>
                  ) : !shippingCalculation ? (
                    <div className="text-center py-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
                      <Truck className="h-12 w-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Shipping Not Available</h3>
                      <p className="text-red-600 mb-4">
                        We don't deliver to this location or the weight exceeds our shipping limits.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-green-800">Dynamic Shipping</p>
                          <p className="text-sm text-green-600">3-7 business days</p>
                        </div>
                        <p className="font-bold text-green-800">
                          {shipping === 0 ? 'Free' : `₹${shipping}`}
                        </p>
                      </div>
                      <div className="text-xs text-green-700 space-y-1">
                        <div>📍 {formData.city}, {formData.state}, {formData.country}</div>
                        <div>⚖️ Weight: {cartWeight.toFixed(1)} KG</div>
                        <div>🌍 Region: {shippingCalculation.region === 'tamilnadu' ? 'Tamil Nadu' : 
                                     shippingCalculation.region === 'india' ? 'Other Indian States' : 
                                     'International'}</div>
                        <div>📦 Weight Slab: {shippingCalculation.weightSlab}</div>
                      </div>
                    </div>
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
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1">
                        <div>
                          <p className="font-medium">{getPaymentMethodDisplayName('razorpay')}</p>
                          <p className="text-sm text-muted-foreground">
                            {getPaymentMethodDescription('razorpay')}
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="zoho" id="zoho" />
                      <Label htmlFor="zoho" className="flex-1">
                        <div>
                          <p className="font-medium">{getPaymentMethodDisplayName('zoho')}</p>
                          <p className="text-sm text-muted-foreground">
                            {getPaymentMethodDescription('zoho')}
                          </p>
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
                    
                    {shippingCalculation && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Weight: {cartWeight.toFixed(1)} KG</div>
                        <div>Region: {shippingCalculation.region === 'tamilnadu' ? 'Tamil Nadu' : 
                                     shippingCalculation.region === 'india' ? 'Other Indian States' : 
                                     'International'}</div>
                        <div>Slab: {shippingCalculation.weightSlab}</div>
                      </div>
                    )}

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
                    disabled={processing || paymentProcessing || isAdmin || !shippingCalculation}
                  >
                    {processing || paymentProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {paymentProcessing ? `Redirecting to ${getPaymentMethodDisplayName(formData.paymentMethod)}...` : "Processing..."}
                      </div>
                    ) : isAdmin ? (
                      "Admin Cannot Purchase"
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