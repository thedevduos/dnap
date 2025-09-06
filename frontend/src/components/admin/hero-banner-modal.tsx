"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { addHeroBanner, updateHeroBanner } from "@/lib/firebase-utils"
import { HeroBanner } from "@/hooks/use-hero-banners"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface HeroBannerModalProps {
  isOpen: boolean
  onClose: () => void
  banner?: HeroBanner | null
}

const AVAILABLE_PAGES = [
  { value: '/about', label: 'About Page' },
  { value: '/services', label: 'Services Page' },
  { value: '/contact', label: 'Contact Page' },
  { value: '/books', label: 'Books Page' },
  { value: '/team', label: 'Team Page' },
  { value: '/careers', label: 'Careers Page' },
  { value: '/privacy-policy', label: 'Privacy Policy' },
  { value: '/terms-conditions', label: 'Terms & Conditions' },
  { value: '/refund-policy', label: 'Refund Policy' },
  { value: '/shipping-policy', label: 'Shipping Policy' },
]

export function HeroBannerModal({ isOpen, onClose, banner }: HeroBannerModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    redirectType: "page" as "page" | "link",
    redirectValue: "",
    isActive: true,
    order: 1,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        imageUrl: banner.imageUrl || "",
        redirectType: banner.redirectType || "page",
        redirectValue: banner.redirectValue || "",
        isActive: banner.isActive !== false,
        order: banner.order || 1,
      })
      setImagePreview(banner.imageUrl || "")
    } else {
      setFormData({
        title: "",
        imageUrl: "",
        redirectType: "page",
        redirectValue: "",
        isActive: true,
        order: 1,
      })
      setImagePreview("")
      setSelectedFile(null)
    }
  }, [banner, isOpen])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, WebP)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedFile(null)
    setImagePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now()
    const fileName = `hero-banners/${timestamp}-${file.name}`
    const storageRef = ref(storage, fileName)
    
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  }

  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      // Extract the file path from the URL
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1])
        const storageRef = ref(storage, filePath)
        await deleteObject(storageRef)
      }
    } catch (error) {
      console.error('Error deleting image from storage:', error)
      // Don't throw error as this is cleanup
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsUploading(true)

    try {
      let imageUrl = formData.imageUrl
      const oldImageUrl = banner?.imageUrl

      // Upload new image if file is selected
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile)
        
        // Delete old image if updating and new image was uploaded
        if (banner && oldImageUrl && oldImageUrl !== imageUrl) {
          await deleteImageFromStorage(oldImageUrl)
        }
      }

      // Validate that we have an image URL
      if (!imageUrl) {
        toast({
          title: "Image required",
          description: "Please select an image for the banner",
          variant: "destructive",
        })
        return
      }

      const bannerData = {
        title: formData.title,
        imageUrl: imageUrl,
        redirectType: formData.redirectType,
        redirectValue: formData.redirectValue,
        isActive: formData.isActive,
        order: parseInt(formData.order.toString()) || 1,
      }

      if (banner) {
        await updateHeroBanner(banner.id, bannerData)
        toast({
          title: "Success",
          description: "Hero banner updated successfully!",
        })
      } else {
        await addHeroBanner(bannerData)
        toast({
          title: "Success",
          description: "Hero banner added successfully!",
        })
      }

      onClose()
    } catch (error) {
      console.error('Error saving banner:', error)
      toast({
        title: "Error",
        description: "Failed to save hero banner. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {banner ? "Edit Hero Banner" : "Add New Hero Banner"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Image Requirements</h4>
            <p className="text-sm text-blue-700">
              <strong>Recommended Size:</strong> 1200px × 600px (2:1 ratio)<br/>
              <strong>Format:</strong> JPG, PNG, or WebP<br/>
              <strong>Max Size:</strong> 2MB<br/>
              <strong>Upload:</strong> Images are automatically uploaded to Firebase Storage
            </p>
          </div>

          <div>
            <Label htmlFor="title">Banner Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter banner title"
              required
            />
          </div>

          <div>
            <Label htmlFor="image">Banner Image *</Label>
            
            {/* File Upload Area */}
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image"
              />
              
              {!imagePreview ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload image</p>
                  <p className="text-xs text-gray-500">JPG, PNG, WebP up to 2MB</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-2 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="redirectType">Redirect Type *</Label>
            <Select 
              value={formData.redirectType} 
              onValueChange={(value: "page" | "link") => setFormData(prev => ({ ...prev, redirectType: value, redirectValue: "" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Internal Page</SelectItem>
                <SelectItem value="link">External Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.redirectType === "page" ? (
            <div>
              <Label htmlFor="redirectPage">Select Page *</Label>
              <Select 
                value={formData.redirectValue} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, redirectValue: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PAGES.map((page) => (
                    <SelectItem key={page.value} value={page.value}>
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="redirectLink">External Link *</Label>
              <Input
                id="redirectLink"
                value={formData.redirectValue}
                onChange={(e) => setFormData(prev => ({ ...prev, redirectValue: e.target.value }))}
                placeholder="https://example.com"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order">Display Order *</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isUploading ? "Uploading..." : isSubmitting ? "Saving..." : banner ? "Update Banner" : "Add Banner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
