"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useCareers } from "@/hooks/use-careers"
import { Search, MapPin,  DollarSign, Briefcase } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface JobApplication {
  jobId: string
  fullName: string
  email: string
  phone: string
  experience: string
  coverLetter: string
  resume: File | null
  answers: { [key: string]: string }
}

export default function CareersPage() {
  const { jobs, loading } = useCareers()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const [application, setApplication] = useState<JobApplication>({
    jobId: "",
    fullName: "",
    email: "",
    phone: "",
    experience: "",
    coverLetter: "",
    resume: null,
    answers: {}
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get unique values for filters
  const departments = [...new Set(jobs.map(job => job.department).filter(Boolean))]
  const types = [...new Set(jobs.map(job => job.type).filter(Boolean))]
  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))]

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || job.department === selectedDepartment
    const matchesType = selectedType === "all" || job.type === selectedType
    const matchesLocation = selectedLocation === "all" || job.location === selectedLocation

    return matchesSearch && matchesDepartment && matchesType && matchesLocation
  })

  const handleJobSelect = (job: any) => {
    setSelectedJob(job)
    setApplication(prev => ({ ...prev, jobId: job.id }))
    setIsApplicationOpen(true)
    setCurrentStep(1)
  }

  const handleInputChange = (field: string, value: string) => {
    setApplication(prev => ({ ...prev, [field]: value }))
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setApplication(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setApplication(prev => ({ ...prev, resume: file }))
    }
  }

  const handleSubmitApplication = async () => {
    if (!selectedJob) return

    setIsSubmitting(true)
    try {
      const applicationData = {
        ...application,
        jobTitle: selectedJob.title,
        jobId: selectedJob.id,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, "jobApplications"), applicationData)
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for your application. We'll get back to you soon.",
      })
      
      setIsApplicationOpen(false)
      setApplication({
        jobId: "",
        fullName: "",
        email: "",
        phone: "",
        experience: "",
        coverLetter: "",
        resume: null,
        answers: {}
      })
      setCurrentStep(1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "full-time": return "bg-green-100 text-green-800"
      case "part-time": return "bg-blue-100 text-blue-800"
      case "contract": return "bg-purple-100 text-purple-800"
      case "internship": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Be part of a team that's passionate about bringing exceptional stories to readers worldwide.
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setSelectedDepartment("all")
              setSelectedType("all")
              setSelectedLocation("all")
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge className={getTypeColor(job.type)}>
                  {job.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(job.createdAt?.toDate()).toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {job.description}
              </p>
              
              <div className="space-y-2 mb-4">
                {job.salary && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{job.salary}</span>
                  </div>
                )}
                {job.experience && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{job.experience}</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => handleJobSelect(job)}
                className="w-full"
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No jobs found matching your criteria.</p>
        </div>
      )}

      {/* Application Modal */}
      <Dialog open={isApplicationOpen} onOpenChange={setIsApplicationOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Please fill out the application form below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Basic Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={application.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={application.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={application.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    value={application.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    placeholder="e.g., 3-5 years"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Custom Questions */}
            {currentStep === 2 && selectedJob?.questions && (
              <div className="space-y-4">
                {selectedJob.questions.map((question: any, index: number) => (
                  <div key={index}>
                    <Label htmlFor={`question-${index}`}>{question.text} *</Label>
                    <Textarea
                      id={`question-${index}`}
                      value={application.answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Cover Letter and Resume */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coverLetter">Cover Letter *</Label>
                  <Textarea
                    id="coverLetter"
                    value={application.coverLetter}
                    onChange={(e) => handleInputChange("coverLetter", e.target.value)}
                    placeholder="Tell us why you're interested in this position..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="resume">Resume/CV *</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 