"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  MapPin, 
  Heart, 
  Package, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Star
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { useOrders } from "@/hooks/use-orders"
import { useWishlist } from "@/hooks/use-wishlist"
import { AddressModal } from "@/components/profile/address-modal"
import { Link } from "react-router-dom"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { userProfile, updateProfile, removeAddress, setDefaultAddress } = useUser()
  const { orders, loading: ordersLoading } = useOrders()
  const { wishlistBooks, loading: wishlistLoading } = useWishlist()
  const { toast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [profileData, setProfileData] = useState({
    firstName: userProfile?.firstName || "",
    lastName: userProfile?.lastName || "",
    phone: userProfile?.phone || "",
  })

  const handleProfileUpdate = async () => {
    try {
      await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      })
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddressEdit = (address: any) => {
    setSelectedAddress(address)
    setIsAddressModalOpen(true)
  }

  const handleAddressDelete = async (addressId: string) => {
    try {
      await removeAddress(addressId)
      toast({
        title: "Address Deleted",
        description: "Address has been removed from your account.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId)
      toast({
        title: "Default Address Updated",
        description: "This address is now your default shipping address.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "shipped": return "bg-purple-100 text-purple-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-muted-foreground">Manage your profile, orders, and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Wishlist
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Personal Information</CardTitle>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-2">
                        <Button onClick={handleProfileUpdate}>
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Account Status</p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.createdAt?.toLocaleDateString()}
                      </p>
                    </div>

                    <Separator />

                    <Button variant="outline" className="w-full" onClick={logout}>
                      <Settings className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Saved Addresses</CardTitle>
                    <Button onClick={() => {
                      setSelectedAddress(null)
                      setIsAddressModalOpen(true)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {userProfile?.addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No addresses saved yet</p>
                      <Button 
                        className="mt-4"
                        onClick={() => setIsAddressModalOpen(true)}
                      >
                        Add Your First Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userProfile?.addresses.map((address) => (
                        <Card key={address.id} className={address.isDefault ? "ring-2 ring-primary" : ""}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">
                                  {address.firstName} {address.lastName}
                                </p>
                                <Badge variant={address.isDefault ? "default" : "secondary"} className="text-xs">
                                  {address.type} {address.isDefault && "• Default"}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAddressEdit(address)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAddressDelete(address.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>{address.address1}</p>
                              {address.address2 && <p>{address.address2}</p>}
                              <p>{address.city}, {address.state} {address.postalCode}</p>
                              <p>{address.country}</p>
                              {address.phone && <p>Phone: {address.phone}</p>}
                            </div>
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => handleSetDefaultAddress(address.id)}
                              >
                                Set as Default
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No orders yet</p>
                      <Button asChild className="mt-4">
                        <Link to="/shop">Start Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.createdAt?.toDate().toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={getOrderStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                                <p className="text-sm font-medium mt-1">₹{order.total}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {order.items.map((item: any, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Qty: {item.quantity} × ₹{item.price}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/order/${order.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </Button>
                              {order.status === "delivered" && (
                                <Button variant="outline" size="sm">
                                  Reorder
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <Card>
                <CardHeader>
                  <CardTitle>My Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  {wishlistLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading wishlist...</p>
                    </div>
                  ) : wishlistBooks.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Your wishlist is empty</p>
                      <Button asChild className="mt-4">
                        <Link to="/shop">Discover Books</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistBooks.map((book) => (
                        <Card key={book.id} className="group hover:shadow-lg transition-all duration-300">
                          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                            <img
                              src={book.imageUrl}
                              alt={book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-1 line-clamp-2">{book.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                            
                            <div className="flex items-center mb-3">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(book.rating || 4.5)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({book.rating || 4.5})
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-primary">₹{book.price}</span>
                              <div className="flex gap-2">
                                <Button size="sm" asChild>
                                  <Link to={`/book/${book.id}`}>View</Link>
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AddressModal
        open={isAddressModalOpen}
        onOpenChange={setIsAddressModalOpen}
        address={selectedAddress}
      />
    </div>
  )
}