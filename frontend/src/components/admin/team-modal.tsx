"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addTeamMember, updateTeamMember, uploadImage } from "@/lib/firebase-utils"
import { Upload } from "lucide-react"

interface TeamModalProps {
  isOpen: boolean
  onClose: () => void
  member?: any | null
}

export function TeamModal({ isOpen, onClose, member }: TeamModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bio: "",
    email: "",
    linkedin: "",
    instagram: "",
    imageUrl: "",
  })
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        role: member.role || "",
        bio: member.bio || "",
        email: member.email || "",
        linkedin: member.linkedin || "",
        instagram: member.instagram || "",
        imageUrl: member.imageUrl || "",
      })
    } else {
      setFormData({
        name: "",
        role: "",
        bio: "",
        email: "",
        linkedin: "",
        instagram: "",
        imageUrl: "",
      })
    }
    setImageFile(null)
  }, [member, isOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setIsUploading(true)

    try {
      const imageUrl = await uploadImage(file, "team")
      setFormData({ ...formData, imageUrl })
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const memberData = {
        name: formData.name,
        role: formData.role,
        bio: formData.bio,
        email: formData.email,
        linkedin: formData.linkedin,
        instagram: formData.instagram,
        imageUrl: formData.imageUrl,
      }

      if (member) {
        await updateTeamMember(member.id, memberData)
        toast({
          title: "Success",
          description: "Team member updated successfully!",
        })
      } else {
        await addTeamMember(memberData)
        toast({
          title: "Success",
          description: "Team member added successfully!",
        })
      }

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save team member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Team Member" : "Add New Team Member"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Job title"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description about the team member..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instagram">Instagram URL</Label>
            <Input
              id="instagram"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="https://instagram.com/username"
            />
          </div>

          <div>
            <Label htmlFor="image">Profile Photo</Label>
            <div className="mt-2">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image")?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Saving..." : member ? "Update Member" : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}