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
  BarChart,
  Settings,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  Image,
  IndianRupee,
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
  const [expandedSections, setExpandedSections] = useState<string[]>([])
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
    // Overview
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, section: "overview" },
    { name: "Profile", href: "/admin/profile", icon: User, section: "overview" },
    
    // Site Management
    { name: "Hero Banners", href: "/admin/hero-banners", icon: Image, section: "site-management" },
    { name: "Updates", href: "/admin/updates", icon: Calendar, section: "site-management" },
    { name: "Emails", href: "/admin/emails", icon: Mail, section: "site-management" },
    { name: "Testimonials", href: "/admin/testimonials", icon: Star, section: "site-management" },
    { name: "Team", href: "/admin/team", icon: Users, section: "site-management" },
    { name: "Careers", href: "/admin/careers", icon: Briefcase, section: "site-management" },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare, section: "site-management" },
    { name: "Reviews", href: "/admin/reviews", icon: Star, section: "site-management" },
    { name: "Zoho Connection", href: "/admin/zoho-connection", icon: Settings, section: "site-management" },
    
    
    // Authors Management
    { name: "Author Books", href: "/admin/author-books", icon: BookOpen, section: "authors" },
    { name: "Affiliate Links", href: "/admin/affiliate-links", icon: LinkIcon, section: "authors" },
    { name: "Sales Reports", href: "/admin/sales-reports", icon: BarChart, section: "authors" },
    { name: "Royalty", href: "/admin/royalty", icon: IndianRupee, section: "authors" },
    
    // E-commerce Management
    { name: "Books", href: "/admin/books", icon: BookOpen, section: "ecommerce" },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart, section: "ecommerce" },
    { name: "Customers", href: "/admin/customers", icon: CustomersIcon, section: "ecommerce" },
    { name: "Users", href: "/admin/users", icon: Users, section: "ecommerce" },
    { name: "Shipping", href: "/admin/shipping", icon: Truck, section: "ecommerce" },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket, section: "ecommerce" },
    { name: "Payments", href: "/admin/payments", icon: CreditCard, section: "ecommerce" },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, section: "ecommerce" },
  ]

  const sections = [
    {
      id: "overview",
      name: "Overview",
      icon: LayoutDashboard,
      items: navigation.filter(item => item.section === "overview")
    },
    {
      id: "site-management",
      name: "Site Management",
      icon: Settings,
      items: navigation.filter(item => item.section === "site-management")
    },
    {
      id: "authors",
      name: "Authors Management",
      icon: Users,
      items: navigation.filter(item => item.section === "authors")
    },
    {
      id: "ecommerce",
      name: "E-commerce Management",
      icon: ShoppingCart,
      items: navigation.filter(item => item.section === "ecommerce")
    }
  ]

  // Initialize with the current section expanded on first load
  useEffect(() => {
    if (expandedSections.length === 0) {
      const currentSection = sections.find(section => 
        section.items.some(item => item.href === location.pathname)
      )
      
      if (currentSection) {
        setExpandedSections([currentSection.id])
      }
    }
  }, [location.pathname, sections, expandedSections.length])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const isSectionExpanded = (sectionId: string) => {
    return expandedSections.includes(sectionId)
  }

  const isCurrentPathInSection = (sectionId: string) => {
    const sectionItems = sections.find(s => s.id === sectionId)?.items || []
    return sectionItems.some(item => location.pathname === item.href)
  }

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

  const renderNavigationItem = (item: any, isMobile: boolean = false) => {
    const isActive = location.pathname === item.href
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive
            ? "bg-orange-600 text-white"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
        onClick={isMobile ? () => setSidebarOpen(false) : undefined}
      >
        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {item.name}
      </Link>
    )
  }

  const renderSection = (section: any, isMobile: boolean = false) => {
    const isExpanded = isSectionExpanded(section.id)
    const hasActiveItem = isCurrentPathInSection(section.id)

    return (
      <div key={section.id} className="space-y-1">
        <button
          onClick={() => toggleSection(section.id)}
          className={cn(
            "group flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
            hasActiveItem
              ? "bg-orange-50 text-orange-700 border border-orange-200"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <div className="flex items-center">
            <section.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {section.name}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isExpanded && (
          <div className="ml-6 space-y-1">
            {section.items.map((item: any) => renderNavigationItem(item, isMobile))}
          </div>
        )}
      </div>
    )
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
                <p className="text-xs text-gray-500">DNA Publications</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-2 px-2 py-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {sections.map(section => renderSection(section, true))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div>
                <span className="text-lg font-bold">Admin Dashboard</span>
                <p className="text-xs text-gray-500">DNA Publications</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-2 px-2 py-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {sections.map(section => renderSection(section, false))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    {user?.photoURL ? (
                      <img
                        src={`https://images.weserv.nl/?url=${encodeURIComponent(user.photoURL)}&w=32&h=32&fit=cover&mask=circle`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
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
                    <span className="font-medium">{user?.displayName || user?.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
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
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}