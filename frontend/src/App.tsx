"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { UserProvider } from "@/contexts/user-context"
import { ProtectedRoute } from "@/components/admin/protected-route"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"


// Pages
import HomePage from "@/pages/home"
import AboutPage from "@/pages/about"
import PricingPage from "@/pages/pricing"
import BooksPage from "@/pages/books"
import ShopPage from "@/pages/shop"
import BookDetailPage from "@/pages/book/[id]"
import CartPage from "@/pages/cart"
import CheckoutPage from "@/pages/checkout"
import LoginPage from "@/pages/auth/login"
import RegisterPage from "@/pages/auth/register"
import ProfilePage from "@/pages/profile/index"
import OrderDetailPage from "@/pages/order/[id]"
import PaymentSuccessPage from "@/pages/payment/success"
import PaymentFailurePage from "@/pages/payment/failure"
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
import AdminOrders from "@/pages/admin/orders"
import AdminShipping from "@/pages/admin/shipping"
import AdminCoupons from "@/pages/admin/coupons"
import AdminPayments from "@/pages/admin/payments"
import AdminCustomers from "@/pages/admin/customers"
import AdminAnalytics from "@/pages/admin/analytics"
import AdminReviews from "@/pages/admin/reviews"
import AdminLogin from "@/pages/admin/login"
import AdminProfile from "@/pages/admin/profile"

import "./globals.css"

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <CartProvider>
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
                          <Route path="/orders" element={<AdminOrders />} />
                          <Route path="/shipping" element={<AdminShipping />} />
                          <Route path="/coupons" element={<AdminCoupons />} />
                          <Route path="/payments" element={<AdminPayments />} />
                          <Route path="/customers" element={<AdminCustomers />} />
                          <Route path="/analytics" element={<AdminAnalytics />} />
                          <Route path="/reviews" element={<AdminReviews />} />
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
                            <Route path="/shop" element={<ShopPage />} />
                            <Route path="/book/:id" element={<BookDetailPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={
                              <ProtectedRoute>
                                <CheckoutPage />
                              </ProtectedRoute>
                            } />
                            <Route path="/auth/login" element={<LoginPage />} />
                            <Route path="/auth/register" element={<RegisterPage />} />
                            <Route path="/profile" element={
                              <ProtectedRoute>
                                <ProfilePage />
                              </ProtectedRoute>
                            } />
                            <Route path="/order/:id" element={
                              <ProtectedRoute>
                                <OrderDetailPage />
                              </ProtectedRoute>
                            } />
                            <Route path="/payment/success" element={<PaymentSuccessPage />} />
                            <Route path="/payment/failure" element={<PaymentFailurePage />} />
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
        </CartProvider>
      </UserProvider>
    </AuthProvider>
  )
}
