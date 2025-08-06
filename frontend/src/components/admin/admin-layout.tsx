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
  Settings,
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
import { useEffect, useRef } from "react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { toast } = useToast()
  const loggedInRef = useRef(false)

  useEffect(() => {
    if (user && !loggedInRef.current) {
      loggedInRef.current = true
    }
  }, [user?.uid])

  const navigation = [
    // Site Management
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, section: "overview" },
    { name: "Profile", href: "/admin/profile", icon: User, section: "overview" },
    { name: "Updates", href: "/admin/updates", icon: Calendar, section: "site-management" },
    { name: "Emails", href: "/admin/emails", icon: Mail, section: "site-management" },
    { name: "Testimonials", href: "/admin/testimonials", icon: Star, section: "site-management" },
    { name: "Team", href: "/admin/team", icon: Users, section: "site-management" },
    { name: "Careers", href: "/admin/careers", icon: Briefcase, section: "site-management" },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare, section: "site-management" },
    { name: "Reviews", href: "/admin/reviews", icon: Star, section: "site-management" },
    { name: "Zoho Connection", href: "/admin/zoho-connection", icon: Settings, section: "site-management" },
    
    // Ecommerce Management
    { name: "Books", href: "/admin/books", icon: BookOpen, section: "ecommerce" },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart, section: "ecommerce" },
    { name: "Customers", href: "/admin/customers", icon: CustomersIcon, section: "ecommerce" },
    { name: "Users", href: "/admin/users", icon: Users, section: "ecommerce" },
    { name: "Shipping", href: "/admin/shipping", icon: Truck, section: "ecommerce" },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket, section: "ecommerce" },
    { name: "Payments", href: "/admin/payments", icon: CreditCard, section: "ecommerce" },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, section: "ecommerce" },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
      navigate("/") // Redirect to home page instead of admin login
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  // Group navigation items by section
  const groupedNavigation = navigation.reduce((groups, item) => {
    const section = item.section || 'other'
    if (!groups[section]) {
      groups[section] = []
    }
    groups[section].push(item)
    return groups
  }, {} as Record<string, typeof navigation>)

  const getSectionDisplayName = (section: string) => {
    switch (section) {
      case 'overview':
        return 'Overview'
      case 'site-management':
        return 'Site Management'
      case 'ecommerce':
        return 'Ecommerce Management'
      default:
        return section.replace(/([A-Z])/g, ' $1').trim()
    }
  }

  const renderNavigationItems = (items: typeof navigation) => {
    return items.map((item) => (
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
    ))
  }

  const renderDesktopNavigationItems = (items: typeof navigation) => {
    return items.map((item) => (
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
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div>
                <span className="text-lg font-bold">Admin Dashboard</span>
                <p className="text-xs text-gray-500">DNA Publications Platform</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto admin-sidebar min-h-0">
            {Object.entries(groupedNavigation).map(([section, items], index) => (
              <div key={section} className="space-y-1">
                {index > 0 && <div className="border-t border-gray-200 my-4" />}
                <h3 className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {getSectionDisplayName(section)}
                </h3>
                {renderNavigationItems(items)}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 min-h-0">
          <div className="flex h-16 items-center px-4 border-b flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div>
                <span className="text-lg font-bold">Admin Dashboard</span>
                <p className="text-xs text-gray-500">DNA Publications Platform</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto admin-sidebar min-h-0">
            {Object.entries(groupedNavigation).map(([section, items], index) => (
              <div key={section} className="space-y-1">
                {index > 0 && <div className="border-t border-gray-200 my-4" />}
                <h3 className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {getSectionDisplayName(section)}
                </h3>
                {renderDesktopNavigationItems(items)}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Fixed Topbar */}
      <div className="lg:pl-64">
        <div className="fixed top-0 right-0 left-0 lg:left-64 z-40 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />
          {/* Pushes the right section to the far right */}

          <div className="flex items-center space-x-4 justify-end">
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="header-item hidden md:flex items-center space-x-2">
                  {user?.photoURL ? (
                    <img
                      src={`https://images.weserv.nl/?url=${encodeURIComponent(user.photoURL)}&w=24&h=24&fit=cover&mask=circle`}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        // Hide the image and show fallback icon
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling
                        if (fallback) {
                          fallback.classList.remove('hidden')
                        }
                      }}
                    />
                  ) : null}
                  <User className={`w-5 h-5 ${user?.photoURL ? 'hidden' : ''}`} />
                  <span>{user?.displayName || user?.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile & Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Go to Homepage
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main content with top padding to account for fixed topbar */}
        <main className="pt-16 p-6">{children}</main>
      </div>
    </div>
  )
}