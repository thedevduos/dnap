"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CartIcon } from "./cart-icon"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import anime from "animejs"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    anime({
      targets: ".header-item",
      opacity: [0, 1],
      translateY: [-20, 0],
      delay: anime.stagger(100),
      duration: 600,
      easing: "easeOutQuart",
    })
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
    if (!isMenuOpen) {
      anime({
        targets: ".mobile-menu-item",
        opacity: [0, 1],
        translateX: [-30, 0],
        delay: anime.stagger(50),
        duration: 300,
        easing: "easeOutQuart",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Books", path: "/books" },
    { name: "Pricing", path: "/pricing" },
    { name: "Team", path: "/team" },
    { name: "Contact", path: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="header-item flex items-center space-x-3">
            <img src="/dnap-cropped.png" alt="DNA Publications" className="h-14 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`header-item font-medium transition-colors duration-200 ${
                  location.pathname === item.path ? "text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <CartIcon />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="header-item hidden md:flex items-center space-x-2">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span>{user.displayName || user.email?.split('@')[0]}</span>
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
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="header-item hidden md:flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link to="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth/register">Sign Up</Link>
                </Button>
              </div>
            )}

            <Button variant="ghost" size="icon" onClick={toggleMenu} className="md:hidden">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t">
            <nav className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`mobile-menu-item font-medium transition-colors duration-200 ${
                    location.pathname === item.path ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mobile-menu-item pt-4">
                <CartIcon />
              </div>
              
              {user ? (
                <div className="mobile-menu-item space-y-2 pt-4 border-t">
                  <Link to="/profile">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      My Account
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="mobile-menu-item space-y-2 pt-4 border-t">
                  <Link to="/auth/login">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
