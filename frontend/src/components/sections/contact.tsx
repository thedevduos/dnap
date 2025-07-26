"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { submitContactForm } from "@/lib/firebase-utils"
import anime from "animejs"

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    details: "info@dnapublications.com",
    action: "mailto:info@dnapublications.com",
    description: "Send us an email anytime"
  },
  {
    icon: Phone,
    title: "Call Us",
    details: "+91 98765 43210",
    action: "tel:+919876543210",
    description: "Mon-Sat from 9am to 6pm"
  },
  {
    icon: MapPin,
    title: "Visit Us",
    details: "Keeranatham, Coimbatore, Tamil Nadu, India",
    action: "#",
    description: "Our headquarters"
  },
]

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "",
    type: "general",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: ".contact-card",
              opacity: [0, 1],
              translateY: [50, 0],
              delay: anime.stagger(200),
              duration: 800,
              easing: "easeOutQuart",
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Use inquiry type as subject
      const submissionData = {
        ...formData,
        subject: formData.type === "general" ? "General Inquiry" : 
                formData.type === "publishing" ? "Publishing Services Inquiry" :
                formData.type === "marketing" ? "Marketing Support Inquiry" :
                formData.type === "technical" ? "Technical Support Inquiry" :
                "Partnership Inquiry"
      }
      
      await submitContactForm(submissionData)
      
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      })

      setFormData({
        name: "",
        email: "",
        mobile: "",
        message: "",
        type: "general",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <section ref={sectionRef} id="contact" className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-orange-200 text-orange-600">
            Contact Us
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Let's Start Your{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
              Publishing Journey
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to publish your book? Have questions about our services? We're here to help you every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Contact */}
            <Card className="contact-card border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Quick Contact
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm">{info.title}</h4>
                      <a href={info.action} className="text-orange-600 hover:text-orange-700 font-medium text-sm block">
                        {info.details}
                      </a>
                      <p className="text-gray-500 text-xs mt-1">{info.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card className="contact-card border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Business Hours
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-sm">Monday - Friday</span>
                    <span className="font-semibold text-sm text-gray-900">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-sm">Saturday</span>
                    <span className="font-semibold text-sm text-gray-900">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-sm">Sunday</span>
                    <span className="font-semibold text-sm text-red-500">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-2">
            <Card className="contact-card border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Send us a Message
                  </span>
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Tell us about your project and we'll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700">
                      Mobile Number *
                    </label>
                    <Input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="type" className="block text-sm font-semibold text-gray-700">
                      Inquiry Type *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full h-12 px-4 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="publishing">Publishing Services</option>
                      <option value="marketing">Marketing Support</option>
                      <option value="technical">Technical Support</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project, goals, or any questions you have..."
                      rows={6}
                      className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200 resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending Message...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact