"use client"

import { useState } from "react"

export function useZohoInvoice() {
  const [creating, setCreating] = useState(false)

  const createInvoice = async (orderData: any) => {
    setCreating(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/zoho/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderData }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Zoho invoice created successfully:', result.data)
        return {
          success: true,
          invoiceId: result.data.invoice_id,
          invoiceNumber: result.data.invoice_number,
          data: result.data
        }
      } else {
        console.error('Failed to create Zoho invoice:', result.message)
        return {
          success: false,
          error: result.message
        }
      }
    } catch (error) {
      console.error('Error creating Zoho invoice:', error)
      return {
        success: false,
        error: 'Failed to create invoice in Zoho Books'
      }
    } finally {
      setCreating(false)
    }
  }

  return {
    createInvoice,
    creating
  }
} 