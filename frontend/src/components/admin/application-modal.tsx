"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useJobApplications } from "@/hooks/use-job-applications"
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Eye, FileText, Calendar, Mail, Phone, Briefcase } from "lucide-react"

interface ApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application?: any
  job?: any
}

export function ApplicationModal({ open, onOpenChange, application, job }: ApplicationModalProps) {
  const { applications } = useJobApplications()
  const { toast } = useToast()
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isViewingDetails, setIsViewingDetails] = useState(false)

  useEffect(() => {
    if (application) {
      setSelectedApplication(application)
      setIsViewingDetails(true)
    } else if (job) {
      setSelectedApplication(null)
      setIsViewingDetails(false)
    }
  }, [application, job, open])

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "jobApplications", applicationId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewApplication = (app: any) => {
    setSelectedApplication(app)
    setIsViewingDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "reviewed": return "bg-blue-100 text-blue-800"
      case "shortlisted": return "bg-purple-100 text-purple-800"
      case "rejected": return "bg-red-100 text-red-800"
      case "hired": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "rejected", label: "Rejected" },
    { value: "hired", label: "Hired" }
  ]

  // If viewing a specific application details
  if (isViewingDetails && selectedApplication) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Viewing application for {selectedApplication.jobTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Application Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedApplication.fullName}</CardTitle>
                    <CardDescription>{selectedApplication.jobTitle}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedApplication.status)}>
                      {selectedApplication.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsViewingDetails(false)}
                    >
                      Back to List
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.experience}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Applied: {selectedApplication.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
              </CardContent>
            </Card>

            {/* Custom Questions */}
            {selectedApplication.answers && Object.keys(selectedApplication.answers).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(selectedApplication.answers).map(([questionId, answer]: [string, any]) => (
                      <div key={questionId} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Question</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {/* You might want to store question text in the application or fetch from job */}
                          Question ID: {questionId}
                        </p>
                        <h4 className="font-medium mb-2">Answer</h4>
                        <p className="whitespace-pre-wrap">{answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((status) => (
                    <Button
                      key={status.value}
                      variant={selectedApplication.status === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(selectedApplication.id, status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // If viewing applications for a specific job
  if (job) {
    const jobApplications = applications.filter(app => app.jobId === job.id)

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applications for {job.title}</DialogTitle>
            <DialogDescription>
              View and manage applications for this position
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {jobApplications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No applications received for this position yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.fullName}
                      </TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.experience}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.createdAt?.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewApplication(app)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {app.resume && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle resume view
                                console.log("View resume:", app.resume)
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return null
} 