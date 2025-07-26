"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Plus, X, ArrowLeft, ArrowRight } from "lucide-react"

interface JobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: any
}

interface JobQuestion {
  id: string
  text: string
  required: boolean
}

export function JobModal({ open, onOpenChange, job }: JobModalProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobData, setJobData] = useState({
    title: "",
    department: "",
    location: "",
    type: "",
    salary: "",
    experience: "",
    description: "",
    requirements: "",
    benefits: "",
    status: "draft",
    questions: [] as JobQuestion[]
  })

  useEffect(() => {
    if (job) {
      setJobData({
        title: job.title || "",
        department: job.department || "",
        location: job.location || "",
        type: job.type || "",
        salary: job.salary || "",
        experience: job.experience || "",
        description: job.description || "",
        requirements: job.requirements || "",
        benefits: job.benefits || "",
        status: job.status || "draft",
        questions: job.questions || []
      })
    } else {
      setJobData({
        title: "",
        department: "",
        location: "",
        type: "",
        salary: "",
        experience: "",
        description: "",
        requirements: "",
        benefits: "",
        status: "draft",
        questions: []
      })
    }
    setCurrentStep(1)
  }, [job, open])

  const handleInputChange = (field: string, value: string) => {
    setJobData(prev => ({ ...prev, [field]: value }))
  }

  const addQuestion = () => {
    const newQuestion: JobQuestion = {
      id: Date.now().toString(),
      text: "",
      required: true
    }
    setJobData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const updateQuestion = (id: string, field: string, value: string | boolean) => {
    setJobData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    }))
  }

  const removeQuestion = (id: string) => {
    setJobData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
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

  const handleSubmit = async () => {
    if (!jobData.title || !jobData.department || !jobData.location || !jobData.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const jobPayload = {
        ...jobData,
        updatedAt: serverTimestamp(),
        questions: jobData.questions.filter(q => q.text.trim() !== "")
      }

      if (job) {
        // Update existing job
        await updateDoc(doc(db, "jobs", job.id), jobPayload)
        toast({
          title: "Job Updated",
          description: "Job posting has been updated successfully.",
        })
      } else {
        // Create new job
        const newJobPayload = { ...jobPayload, createdAt: serverTimestamp() }
        await addDoc(collection(db, "jobs"), newJobPayload)
        toast({
          title: "Job Created",
          description: "New job posting has been created successfully.",
        })
      }

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Freelance"
  ]

  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "Design",
    "Content",
    "Operations",
    "Human Resources",
    "Finance",
    "Customer Support",
    "Product Management"
  ]

  const statuses = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? "Edit Job" : "Add New Job"}
          </DialogTitle>
          <DialogDescription>
            Create a new job posting with custom application questions.
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

          {/* Step 1: Basic Job Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={jobData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={jobData.department} onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={jobData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., New York, NY"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Job Type *</Label>
                  <Select value={jobData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    value={jobData.salary}
                    onChange={(e) => handleInputChange("salary", e.target.value)}
                    placeholder="e.g., ₹8,00,000 - ₹12,00,000"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience Required</Label>
                  <Input
                    id="experience"
                    value={jobData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    placeholder="e.g., 3-5 years"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the role and responsibilities..."
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Requirements and Benefits */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="requirements">Requirements & Qualifications</Label>
                <Textarea
                  id="requirements"
                  value={jobData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  placeholder="List the required skills, qualifications, and experience..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="benefits">Benefits & Perks</Label>
                <Textarea
                  id="benefits"
                  value={jobData.benefits}
                  onChange={(e) => handleInputChange("benefits", e.target.value)}
                  placeholder="List the benefits and perks offered..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={jobData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Custom Questions */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Custom Application Questions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {jobData.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">Question {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label htmlFor={`question-${question.id}`}>Question Text</Label>
                      <Textarea
                        id={`question-${question.id}`}
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                        placeholder="Enter your question..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${question.id}`}
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, "required", e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`required-${question.id}`} className="text-sm">
                        Required question
                      </Label>
                    </div>
                  </div>
                ))}

                {jobData.questions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No custom questions added yet.</p>
                    <p className="text-sm">Click "Add Question" to create custom application questions.</p>
                  </div>
                )}
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : (job ? "Update Job" : "Create Job")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 