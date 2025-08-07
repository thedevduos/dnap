"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
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
  clearCart: (showToast?: boolean) => void
  replaceCart: (plan: EbookPlan) => void
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

  const addToCart = useCallback((plan: EbookPlan) => {
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
  }, [])

  const removeFromCart = useCallback((planId: string) => {
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
  }, [])

  const clearCart = useCallback((showToast?: boolean) => {
    setItems([])
    if (showToast !== false) {
      toast({
        title: "Cart Cleared",
        description: "All plans have been removed from your cart",
      })
    }
  }, [])

  const replaceCart = useCallback((plan: EbookPlan) => {
    setItems([{ plan, quantity: 1 }])
    toast({
      title: "Cart Replaced",
      description: `${plan.title} has been added to your cart`,
    })
  }, [])

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.plan.price, 0)
  }, [items])

  const getTotalItems = useCallback(() => {
    return items.length
  }, [items])

  const isInCart = useCallback((planId: string) => {
    return items.some(item => item.plan.id === planId)
  }, [items])

  const value = useMemo(() => ({
    items,
    addToCart,
    removeFromCart,
    clearCart,
    replaceCart,
    getTotalPrice,
    getTotalItems,
    isInCart,
  }), [items, addToCart, removeFromCart, clearCart, replaceCart, getTotalPrice, getTotalItems, isInCart])

  return <EbookCartContext.Provider value={value}>{children}</EbookCartContext.Provider>
}