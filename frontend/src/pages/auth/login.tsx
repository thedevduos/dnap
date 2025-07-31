"use client"

import { useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Lock, Eye, EyeOff } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle()
      toast({
        title: "Welcome!",
        description: "You have been logged in with Google.",
      })
      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Google login failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
    </div>
  )
}