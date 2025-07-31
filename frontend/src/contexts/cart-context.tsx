"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
  id: string
  title: string
  author: string
  price: number
  imageUrl: string
  quantity: number
  category: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  isInCart: (id: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('dna-publications-cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('dna-publications-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id)
      if (existingItem) {
        toast({
          title: "Item Updated",
          description: `${item.title} quantity increased in cart`,
        })
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        toast({
          title: "Added to Cart",
          description: `${item.title} has been added to your cart`,
        })
        return [...prevItems, { ...item, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (id: string) => {
    setItems(prevItems => {
      const item = prevItems.find(i => i.id === id)
      if (item) {
        toast({
          title: "Removed from Cart",
          description: `${item.title} has been removed from your cart`,
        })
      }
      return prevItems.filter(i => i.id !== id)
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setItems(prevItems =>
      prevItems.map(i =>
        i.id === id ? { ...i, quantity } : i
      )
    )
  }

  const clearCart = () => {
    setItems([])
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    })
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const isInCart = (id: string) => {
    return items.some(item => item.id === id)
  }

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}