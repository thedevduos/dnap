"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/admin/protected-route"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"


// Pages
import HomePage from "@/pages/home"
import AboutPage from "@/pages/about"
import PricingPage from "@/pages/pricing"
import BooksPage from "@/pages/books"
import TeamPage from "@/pages/team"
import ContactPage from "@/pages/contact"
import PrivacyPolicy from "@/pages/privacy-policy"
import RefundPolicy from "@/pages/refund-policy"
import ShippingPolicy from "@/pages/shipping-policy"
import TermsConditions from "@/pages/terms-conditions"
import CareersPage from "@/pages/careers"

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard"
import AdminBooks from "@/pages/admin/books"
import AdminTestimonials from "@/pages/admin/testimonials"
import AdminUpdates from "@/pages/admin/updates"
import AdminMessages from "@/pages/admin/messages"
import AdminEmails from "@/pages/admin/emails"
import AdminUsers from "@/pages/admin/users"
import AdminTeam from "@/pages/admin/team"
import AdminCareers from "@/pages/admin/careers"
import AdminLogin from "@/pages/admin/login"
import AdminProfile from "@/pages/admin/profile"

import "./globals.css"

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="dna-publications-theme">
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Admin Login Route */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/dashboard" element={<AdminDashboard />} />
                      <Route path="/books" element={<AdminBooks />} />
                      <Route path="/users" element={<AdminUsers />} />
                      <Route path="/team" element={<AdminTeam />} />
                      <Route path="/careers" element={<AdminCareers />} />
                      <Route path="/testimonials" element={<AdminTestimonials />} />
                      <Route path="/updates" element={<AdminUpdates />} />
                      <Route path="/messages" element={<AdminMessages />} />
                      <Route path="/emails" element={<AdminEmails />} />
                      <Route path="/profile" element={<AdminProfile />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Public Routes */}
              <Route
                path="/*"
                element={
                  <>
                    <Header />
                    <main>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/books" element={<BooksPage />} />
                                              <Route path="/team" element={<TeamPage />} />
                      <Route path="/careers" element={<CareersPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/refund-policy" element={<RefundPolicy />} />
                      <Route path="/shipping-policy" element={<ShippingPolicy />} />
                      <Route path="/terms-conditions" element={<TermsConditions />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                }
              />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}
