"use client"

import type React from "react"

import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { subscribeToNewsletter } from "@/lib/firebase-utils"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubscribing(true)
    try {
      await subscribeToNewsletter(email)
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      })
      setEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  const footerLinks = {
    company: [
      { name: "About Us", path: "/about" },
      { name: "Our Team", path: "/team" },
      { name: "Careers", path: "/careers" },
    ],
    services: [
      { name: "Publishing", path: "/pricing" },
      { name: "E-books", path: "/books" },
      { name: "Subscriptions", path: "/pricing" },
      { name: "Author Services", path: "/pricing" },
    ],
    support: [
      { name: "Contact Us", path: "/contact" },
      { name: "Privacy Policy", path: "/privacy-policy" },
      { name: "Refund Policy", path: "/refund-policy" },
      { name: "Shipping Policy", path: "/shipping-policy" },
      { name: "Terms & Conditions", path: "/terms-conditions" },
    ],
  }

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61556592211270", label: "Facebook" },
    { icon: Twitter, href: "https://x.com/", label: "Twitter" },
    { icon: Instagram, href: "https://www.instagram.com/dnap.tn", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/dnap-in/", label: "LinkedIn" },
  ]

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/dnap-cropped.png" alt="DNA Publications" className="h-14 w-auto" />
              <span className="text-3xl font-bold text-primary">DNA Publications</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              The home of ambitious writers. Bringing exceptional stories to readers worldwide.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-2">
              <h4 className="font-semibold">Stay Updated</h4>
              <form onSubmit={handleNewsletterSubmit} className="flex space-x-2">
                <Input
                  placeholder="Enter your email"
                  className="flex-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
                <Button type="submit" disabled={isSubscribing}>
                  {isSubscribing ? "..." : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} DNA Publications. All rights reserved.
            </div>

            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}