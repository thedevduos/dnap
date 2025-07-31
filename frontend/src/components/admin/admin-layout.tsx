"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Mail, 
  Menu, 
  X, 
  Star, 
  Calendar,
  LogOut,
  User,
  Briefcase,
  ShoppingCart,
  Truck,
  Ticket,
  CreditCard,
  Users as CustomersIcon,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect } from "react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      console.log('User logged in:', user.email)
    }
  }, [user?.uid])

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/admin/profile", icon: User },
    { name: "Books", href: "/admin/books", icon: BookOpen },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Team", href: "/admin/team", icon: Users },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Customers", href: "/admin/customers", icon: CustomersIcon },
    { name: "Shipping", href: "/admin/shipping", icon: Truck },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Careers", href: "/admin/careers", icon: Briefcase },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare },
    { name: "Emails", href: "/admin/emails", icon: Mail },
    { name: "Testimonials", href: "/admin/testimonials", icon: Star },
    { name: "Updates", href: "/admin/updates", icon: Calendar },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
      navigate("/admin/login")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div>
                <span className="text-lg font-bold">Admin Dashboard</span>
                <p className="text-xs text-gray-500">DNA Publications Platform</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location.pathname === item.href
                    ? "bg-orange-600 text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div>
                <span className="text-lg font-bold">Admin Dashboard</span>
                <p className="text-xs text-gray-500">DNA Publications Platform</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location.pathname === item.href
                    ? "bg-orange-600 text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />
          {/* Pushes the right section to the far right */}

          <div className="flex items-center space-x-4 justify-end">
            <Button variant="outline" asChild>
              <Link to="/" target="_blank" rel="noopener noreferrer">View Site</Link>
            </Button>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 rounded-full hover:bg-gray-100">
                  {user?.photoURL ? (
                    <img
                      src={`https://images.weserv.nl/?url=${encodeURIComponent(user.photoURL)}&w=36&h=36&fit=cover&mask=circle`}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
                      loading="lazy"
                      onError={(e) => {
                        // Hide the image and show fallback
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling
                        if (fallback) {
                          fallback.classList.remove('hidden')
                        }
                      }}
                    />
                  ) : null}
                  <div className={`w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center ${user?.photoURL ? 'hidden' : ''}`}>
                    {user?.displayName ? (
                      <span className="text-white font-semibold text-sm">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.displayName || user?.email?.split('@')[0] || 'Administrator'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}