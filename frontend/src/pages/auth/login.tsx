"use client"

import { useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Lock, Eye, EyeOff, Mail, CheckCircle, Ban } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'success'>('email')
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ""
  })
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false)
  const [showSuspendedModal, setShowSuspendedModal] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(credentials.email, credentials.password)
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      })
      
      // Simple redirect to intended destination
      navigate(from, { replace: true })
    } catch (error: any) {
      if (error.code === 'auth/account-suspended') {
        setShowSuspendedModal(true)
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle()
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in with Google.",
      })
      
      // Simple redirect to intended destination
      navigate(from, { replace: true })
    } catch (error: any) {
      if (error.code === 'auth/account-suspended' || error.message === 'ACCOUNT_SUSPENDED') {
        setShowSuspendedModal(true)
      } else if (error.message === 'USER_NOT_FOUND') {
        toast({
          title: "Account Not Found",
          description: "Please register first before signing in with Google.",
          variant: "destructive",
        })
        // Redirect to registration page
        navigate('/auth/register', { 
          state: { 
            from: location.state?.from,
            googleEmail: error.email // Pass the Google email for pre-filling
          } 
        })
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Don't show error toast for popup closed by user - this is expected behavior
      } else {
        toast({
          title: "Google Login Failed",
          description: "Failed to login with Google. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (!forgotPasswordData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      return
    }

    setIsForgotPasswordLoading(true)
    try {
      // Use Firebase's built-in password reset email
      await sendPasswordResetEmail(auth, forgotPasswordData.email)
      
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for the password reset link.",
      })
      setForgotPasswordStep('success')
    } catch (error: any) {
      let errorMessage = "Please try again later."
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address."
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address."
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later."
      }
      
      toast({
        title: "Failed to Send Reset Email",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }


  const resetForgotPasswordModal = () => {
    setShowForgotPassword(false)
    setForgotPasswordStep('email')
    setForgotPasswordData({
      email: ""
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-orange-100">
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-muted-foreground">Sign in to your DNA Publications account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-right mt-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center justify-center">
            <Separator className="flex-1" />
            <span className="px-4 text-xs text-gray-400 uppercase">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/auth/register" state={{ from: location.state?.from }} className="text-primary hover:underline">
                Create one here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {forgotPasswordStep === 'email' && 'Reset Password'}
              {forgotPasswordStep === 'success' && 'Reset Email Sent'}
            </DialogTitle>
          </DialogHeader>

          {forgotPasswordStep === 'email' && (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground">
                Enter your email address and we'll send you a password reset link.
              </div>
              <div>
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordData.email}
                  onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={resetForgotPasswordModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleSendOTP}
                  disabled={isForgotPasswordLoading}
                >
                  {isForgotPasswordLoading ? "Sending..." : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}


          {forgotPasswordStep === 'success' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Reset Email Sent!</h3>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <strong>{forgotPasswordData.email}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={resetForgotPasswordModal}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspended Account Modal */}
      <Dialog open={showSuspendedModal} onOpenChange={setShowSuspendedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600">Account Suspended</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Ban className="h-16 w-16 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600">Your Account Has Been Suspended</h3>
              <p className="text-muted-foreground mt-2">
                Your account has been temporarily suspended. Please contact our management team for more details and assistance.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Contact Information:</strong><br />
                Email: info@dnap.in<br />
                Phone: 7598691689
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => setShowSuspendedModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}