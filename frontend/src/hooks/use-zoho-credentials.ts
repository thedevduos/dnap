import { useState, useEffect } from 'react'
import { getZohoCredentials, updateZohoCredentials } from '@/lib/firebase-utils'
import { useToast } from '@/hooks/use-toast'

interface ZohoCredentials {
  ZOHO_CLIENT_ID?: string
  ZOHO_CLIENT_SECRET?: string
  ZOHO_ACCESS_TOKEN?: string
  ZOHO_REFRESH_TOKEN?: string
  ZOHO_ORGANIZATION_ID?: string
  ZOHO_PAYMENTS_ACCOUNT_ID?: string
  token_expires_at?: number
  createdAt?: string
  updatedAt?: string
}

export function useZohoCredentials() {
  const [credentials, setCredentials] = useState<ZohoCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCredentials = async () => {
    try {
      setLoading(true)
      setError(null)
      const creds = await getZohoCredentials()
      setCredentials(creds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credentials')
      console.error('Error fetching Zoho credentials:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateCredentials = async (newCredentials: Partial<ZohoCredentials>) => {
    try {
      setLoading(true)
      setError(null)
      
      const updatedCreds = {
        ...credentials,
        ...newCredentials,
        updatedAt: new Date().toISOString()
      }
      
      await updateZohoCredentials(updatedCreds)
      setCredentials(updatedCreds)
      
      toast({
        title: "Credentials Updated",
        description: "Zoho credentials have been updated successfully",
      })
      
      return updatedCreds
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update credentials'
      setError(errorMessage)
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addPaymentsAccountId = async (accountId: string) => {
    return await updateCredentials({ ZOHO_PAYMENTS_ACCOUNT_ID: accountId })
  }

  useEffect(() => {
    fetchCredentials()
  }, [])

  return {
    credentials,
    loading,
    error,
    fetchCredentials,
    updateCredentials,
    addPaymentsAccountId
  }
} 