"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { EbookPlan } from "@/types/ebook"

interface EbookCartItem {
  plan: EbookPlan
  quantity: number
}

interface EbookCartContextType {
  items: EbookCartItem[]
  addToCart: (plan: EbookPlan) => void
  removeFromCart: (planId: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  isInCart: (planId: string) => boolean
}

const EbookCartContext = createContext<EbookCartContextType | undefined>(undefined)

export function useEbookCart() {
  const context = useContext(EbookCartContext)
  if (context === undefined) {
    throw new Error("useEbookCart must be used within an EbookCartProvider")
  }
  return context
}

export function EbookCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<EbookCartItem[]>([])
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('dna-publications-ebook-cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading ebook cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('dna-publications-ebook-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (plan: EbookPlan) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.plan.id === plan.id)
      if (existingItem) {
        toast({
          title: "Plan Already in Cart",
          description: `${plan.title} is already in your cart`,
        })
        return prevItems
      } else {
        toast({
          title: "Added to Cart",
          description: `${plan.title} has been added to your cart`,
        })
        return [...prevItems, { plan, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (planId: string) => {
    setItems(prevItems => {
      const item = prevItems.find(i => i.plan.id === planId)
      if (item) {
        toast({
          title: "Removed from Cart",
          description: `${item.plan.title} has been removed from your cart`,
        })
      }
      return prevItems.filter(i => i.plan.id !== planId)
    })
  }

  const clearCart = () => {
    setItems([])
    toast({
      title: "Cart Cleared",
      description: "All plans have been removed from your cart",
    })
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.plan.price, 0)
  }

  const getTotalItems = () => {
    return items.length
  }

  const isInCart = (planId: string) => {
    return items.some(item => item.plan.id === planId)
  }

  const value = {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isInCart,
  }

  return <EbookCartContext.Provider value={value}>{children}</EbookCartContext.Provider>
}