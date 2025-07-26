"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useCareersAdmin } from "@/hooks/use-careers-admin"
import { useJobApplications } from "@/hooks/use-job-applications"
import { JobModal } from "@/components/admin/job-modal"
import { ApplicationModal } from "@/components/admin/application-modal"
import { ResumeModal } from "@/components/admin/resume-modal"
import { Plus, Eye, Download, FileText, Users, Briefcase, Trash2 } from "lucide-react"
import { exportToExcel } from "@/lib/excel-utils"
import { deleteDoc, doc } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminCareersPage() {
  const { jobs, loading: jobsLoading } = useCareersAdmin()
  const { applications, loading: applicationsLoading } = useJobApplications()
  const { toast } = useToast()
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [selectedResume, setSelectedResume] = useState<any>(null)
  const [jobToDelete, setJobToDelete] = useState<any>(null)
  const [applicationToDelete, setApplicationToDelete] = useState<any>(null)

  const handleAddJob = () => {
    setSelectedJob(null)
    setIsJobModalOpen(true)
  }

  const handleEditJob = (job: any) => {
    setSelectedJob(job)
    setIsJobModalOpen(true)
  }

  const handleViewApplications = (job: any) => {
    setSelectedJob(job)
    setIsApplicationModalOpen(true)
  }

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application)
    setIsApplicationModalOpen(true)
  }

  const handleViewResume = (resume: any) => {
    setSelectedResume(resume)
    setIsResumeModalOpen(true)
  }

  const handleExportJobApplications = async (jobId: string) => {
    try {
      const jobApplications = applications.filter(app => app.jobId === jobId)
      const job = jobs.find(j => j.id === jobId)
      
      if (jobApplications.length === 0) {
        toast({
          title: "No Data",
          description: "No applications found for this job.",
          variant: "destructive",
        })
        return
      }

      await exportToExcel(jobApplications, `applications-${job?.title || jobId}`)
      
      toast({
        title: "Export Successful",
        description: "Job applications exported to Excel successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export applications. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    setJobToDelete(job)
  }

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return

    try {
      const jobApplications = applications.filter(app => app.jobId === jobToDelete.id)
      
      // Export applications if any exist
      if (jobApplications.length > 0) {
        try {
          await exportToExcel(jobApplications, `applications-backup-${jobToDelete?.title || jobToDelete.id}`)
          toast({
            title: "Applications Exported",
            description: `Exported ${jobApplications.length} applications before deletion.`,
          })
        } catch (exportError) {
          console.warn("Failed to export applications:", exportError)
          toast({
            title: "Export Warning",
            description: "Failed to export applications, but proceeding with deletion.",
            variant: "destructive",
          })
        }
      }

      // Delete all applications for this job and their resume files
      for (const application of jobApplications) {
        try {
          // Delete the application document
          await deleteDoc(doc(db, "jobApplications", application.id))
          
          // Delete resume file if it exists
          if (application?.resume?.url) {
            try {
              const url = new URL(application.resume.url)
              const pathSegments = url.pathname.split('/')
              const filePath = pathSegments.slice(pathSegments.indexOf('o') + 1).join('/')
              const decodedPath = decodeURIComponent(filePath)
              
              const fileRef = ref(storage, decodedPath)
              await deleteObject(fileRef)
            } catch (storageError) {
              console.warn("Failed to delete resume file from storage:", storageError)
            }
          }
        } catch (appError) {
          console.warn("Failed to delete application:", appError)
        }
      }

      // Finally delete the job
      await deleteDoc(doc(db, "jobs", jobToDelete.id))
      
      toast({
        title: "Job Deleted",
        description: `Job and ${jobApplications.length} applications have been deleted successfully.`,
      })
    } catch (error) {
      console.error("Delete job error:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setJobToDelete(null)
    }
  }

  const handleDeleteApplication = async (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId)
    setApplicationToDelete(application)
  }

  const confirmDeleteApplication = async () => {
    if (!applicationToDelete) return

    try {
      // Delete the application document first
      await deleteDoc(doc(db, "jobApplications", applicationToDelete.id))
      
      // If application has a resume, delete it from storage
      if (applicationToDelete?.resume?.url) {
        try {
          // Extract the file path from the URL
          const url = new URL(applicationToDelete.resume.url)
          const pathSegments = url.pathname.split('/')
          const filePath = pathSegments.slice(pathSegments.indexOf('o') + 1).join('/')
          const decodedPath = decodeURIComponent(filePath)
          
          // Delete the file from storage
          const fileRef = ref(storage, decodedPath)
          await deleteObject(fileRef)
        } catch (storageError) {
          console.warn("Failed to delete resume file from storage:", storageError)
          // Don't fail the entire operation if storage deletion fails
        }
      }
      
      toast({
        title: "Application Deleted",
        description: "Application and resume have been deleted successfully.",
      })
    } catch (error) {
      console.error("Delete application error:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setApplicationToDelete(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "inactive": return "bg-gray-100 text-gray-800"
      case "draft": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "reviewed": return "bg-blue-100 text-blue-800"
      case "shortlisted": return "bg-purple-100 text-purple-800"
      case "rejected": return "bg-red-100 text-red-800"
      case "hired": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Careers Management</h1>
            <p className="text-muted-foreground">Manage job postings and applications</p>
          </div>
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Job Postings</CardTitle>
                    <CardDescription>Manage all job postings</CardDescription>
                  </div>
                  <Button onClick={handleAddJob}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs to display</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first job posting.</p>
                    <Button onClick={handleAddJob}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Job
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => {
                        const jobApplications = applications.filter(app => app.jobId === job.id)
                        return (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{job.department}</TableCell>
                            <TableCell>{job.location}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{job.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(job.status)}>
                                {job.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {jobApplications.length} applications
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {job.createdAt?.toDate().toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditJob(job)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewApplications(job)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportJobApplications(job.id)}
                                  disabled={jobApplications.length === 0}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Export
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Applications</CardTitle>
                    <CardDescription>View and manage all job applications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications to display</h3>
                    <p className="text-gray-500 mb-4">Applications will appear here once candidates start applying to your job postings.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">
                            {application.fullName}
                          </TableCell>
                          <TableCell>{application.jobTitle}</TableCell>
                          <TableCell>{application.email}</TableCell>
                          <TableCell>{application.experience}</TableCell>
                          <TableCell>
                            <Badge className={getApplicationStatusColor(application.status)}>
                              {application.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {application.createdAt?.toDate().toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewApplication(application)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {application.resume && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewResume(application.resume)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Resume
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteApplication(application.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Job Modal */}
        <JobModal
          open={isJobModalOpen}
          onOpenChange={setIsJobModalOpen}
          job={selectedJob}
        />

        {/* Application Modal */}
        <ApplicationModal
          open={isApplicationModalOpen}
          onOpenChange={setIsApplicationModalOpen}
          application={selectedApplication}
          job={selectedJob}
        />

        {/* Resume Modal */}
        <ResumeModal
          open={isResumeModalOpen}
          onOpenChange={setIsResumeModalOpen}
          resume={selectedResume}
        />

        {/* Delete Job Alert Dialog */}
        <AlertDialog open={!!jobToDelete} onOpenChange={() => setJobToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{jobToDelete?.title}"? This action will:
                <br />
                • Export all applications as backup
                <br />
                • Delete all applications and their resume files
                <br />
                • Delete the job posting
                <br />
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteJob}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Application Alert Dialog */}
        <AlertDialog open={!!applicationToDelete} onOpenChange={() => setApplicationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the application from "{applicationToDelete?.fullName}" for "{applicationToDelete?.jobTitle}"? This action will:
                <br />
                • Delete the application data
                <br />
                • Delete the resume file
                <br />
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteApplication}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Application
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
} 