"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

interface AddressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address?: any
}

export function AddressModal({ open, onOpenChange, address }: AddressModalProps) {
  const { addAddress, updateAddress } = useUser()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: "home" as "home" | "work" | "other",
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    isDefault: false,
  })

  useEffect(() => {
    if (address) {
      setFormData({
        type: address.type || "home",
        firstName: address.firstName || "",
        lastName: address.lastName || "",
        company: address.company || "",
        address1: address.address1 || "",
        address2: address.address2 || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.country || "India",
        phone: address.phone || "",
        isDefault: address.isDefault || false,
      })
    } else {
      setFormData({
        type: "home",
        firstName: "",
        lastName: "",
        company: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        phone: "",
        isDefault: false,
      })
    }
  }, [address, open])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'address1', 'city', 'state', 'postalCode']
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
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

    setIsSubmitting(true)

    try {
      if (address) {
        await updateAddress(address.id, formData)
        toast({
          title: "Address Updated",
          description: "Your address has been updated successfully.",
        })
      } else {
        await addAddress(formData)
        toast({
          title: "Address Added",
          description: "Your address has been saved successfully.",
        })
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Puducherry", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Andaman and Nicobar Islands"
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {address ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Address Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="address1">Address Line 1 *</Label>
            <Input
              id="address1"
              value={formData.address1}
              onChange={(e) => handleInputChange("address1", e.target.value)}
              placeholder="Street address, P.O. Box, company name"
              required
            />
          </div>

          <div>
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              value={formData.address2}
              onChange={(e) => handleInputChange("address2", e.target.value)}
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleInputChange("postalCode", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="India">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => handleInputChange("isDefault", checked as boolean)}
            />
            <Label htmlFor="isDefault">Set as default address</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : address ? "Update Address" : "Add Address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}