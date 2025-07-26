"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import anime from "animejs"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

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
            <Link to="/contact">
              <Button className="header-item hidden md:inline-flex bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:from-amber-500 hover:to-orange-500 transition-all">
                Become an Author Today!
              </Button>
            </Link>

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
              <Link to="/contact">
                <Button className="mobile-menu-item w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:from-amber-500 hover:to-orange-500 transition-all">
                  Become an Author Today!
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
