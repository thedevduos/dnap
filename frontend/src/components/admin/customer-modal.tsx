"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, MapPin, Package, Calendar, Heart } from "lucide-react"

interface CustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: any
}

export function CustomerModal({ open, onOpenChange, customer }: CustomerModalProps) {
  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="flex items-center gap-4">
            {customer.photoURL ? (
              <img
                src={`https://images.weserv.nl/?url=${encodeURIComponent(customer.photoURL)}&w=64&h=64&fit=cover&mask=circle`}
                alt={customer.displayName}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  // Hide the image and show fallback
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling
                  if (fallback) {
                    fallback.classList.remove('hidden')
                  }
                }}
              />
            ) : null}
            <div className={`w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ${customer.photoURL ? 'hidden' : ''}`}>
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{customer.displayName || "N/A"}</h3>
              <p className="text-muted-foreground">{customer.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                {customer.preferences?.newsletter && (
                  <Badge variant="outline">Newsletter Subscriber</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {customer.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Addresses</h4>
              <div className="space-y-3">
                {customer.addresses.map((address: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{address.type}</span>
                      {address.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{address.firstName} {address.lastName}</p>
                      <p>{address.address1}</p>
                      {address.address2 && <p>{address.address2}</p>}
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Statistics */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Order Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{customer.orderCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <span className="text-2xl font-bold">₹{customer.totalSpent || 0}</span>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Heart className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{customer.wishlist?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Wishlist Items</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}