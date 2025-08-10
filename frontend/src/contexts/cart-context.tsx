"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { validateCoupon } from "@/lib/firebase-utils"

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
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  restoreCartFromOrderData: (orderData: any) => void
  getTotalItems: () => number
  getTotalPrice: () => number
  isInCart: (itemId: string) => boolean
  appliedAffiliateCoupon: any | null
  applyAffiliateCoupon: (couponCode: string) => Promise<void>
  clearAffiliateCoupon: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [appliedAffiliateCoupon, setAppliedAffiliateCoupon] = useState<any | null>(null)
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

  // Check for affiliate coupon on mount
  useEffect(() => {
    const affiliateCoupon = sessionStorage.getItem('affiliateCoupon')
    if (affiliateCoupon) {
      applyAffiliateCoupon(affiliateCoupon)
    }
  }, [])

  const applyAffiliateCoupon = async (couponCode: string) => {
    try {
      const result = await validateCoupon(couponCode, getTotalPrice())
      if (result.coupon.isAffiliate) {
        setAppliedAffiliateCoupon(result.coupon)
        sessionStorage.setItem('affiliateCoupon', couponCode)
      }
    } catch (error) {
      console.error('Error applying affiliate coupon:', error)
    }
  }

  const clearAffiliateCoupon = () => {
    setAppliedAffiliateCoupon(null)
    sessionStorage.removeItem('affiliateCoupon')
  }

  const addToCart = (item: CartItem) => {
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

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => {
      const item = prevItems.find(i => i.id === itemId)
      if (item) {
        toast({
          title: "Removed from Cart",
          description: `${item.title} has been removed from your cart`,
        })
      }
      return prevItems.filter(i => i.id !== itemId)
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setItems(prevItems =>
      prevItems.map(i =>
        i.id === itemId ? { ...i, quantity } : i
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

  const restoreCartFromOrderData = (orderData: any) => {
    console.log('Restoring cart from order data:', orderData)
    if (orderData.items && orderData.items.length > 0) {
      const restoredItems: CartItem[] = orderData.items.map((item: any) => ({
        id: item.bookId,
        title: item.title,
        author: item.author,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category || 'book',
        quantity: item.quantity
      }))
      
      console.log('Restored cart items:', restoredItems)
      setItems(restoredItems)
      toast({
        title: "Cart Restored",
        description: "Your cart items have been restored from the previous order attempt.",
      })
    }
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const isInCart = (itemId: string) => {
    return items.some(item => item.id === itemId)
  }

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    restoreCartFromOrderData,
    getTotalItems,
    getTotalPrice,
    isInCart,
    appliedAffiliateCoupon,
    applyAffiliateCoupon,
    clearAffiliateCoupon
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}