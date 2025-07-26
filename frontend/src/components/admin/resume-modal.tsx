"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, ExternalLink } from "lucide-react"

interface ResumeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resume?: any
}

export function ResumeModal({ open, onOpenChange, resume }: ResumeModalProps) {
  if (!resume) return null

  const handleDownload = () => {
    // Handle resume download
    if (resume.url) {
      const link = document.createElement('a')
      link.href = resume.url
      link.download = resume.name || 'resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleView = () => {
    // Handle resume view in new tab
    if (resume.url) {
      window.open(resume.url, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resume</DialogTitle>
          <DialogDescription>
            View and download the applicant's resume
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <h4 className="font-medium">{resume.name || 'Resume'}</h4>
              <p className="text-sm text-muted-foreground">
                {resume.size ? `${(resume.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleView} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Resume
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Note: If the resume doesn't open, you can download it and view it locally.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 