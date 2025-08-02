"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Database,
  Wifi,
  AlertCircle,
  Plus
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useZohoCredentials } from "@/hooks/use-zoho-credentials"
import { AdminLayout } from "@/components/admin/admin-layout"

interface ZohoConnectionStatus {
  success: boolean
  message: string
  booksStatus: 'connected' | 'failed' | 'unknown'
  paymentsStatus: 'connected' | 'failed' | 'unknown'
  organizationId?: string
  clientId?: string
  error?: string | { code?: string; message?: string }
}

interface ZohoAutoRefreshStatus {
  success: boolean
  autoRefreshEnabled: boolean
  refreshInterval: number
  nextRefreshTime: string
  timeUntilNextRefresh: number
  lastRefreshTime: string
}

export default function ZohoConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<ZohoConnectionStatus | null>(null)
  const [autoRefreshStatus, setAutoRefreshStatus] = useState<ZohoAutoRefreshStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [paymentsAccountId, setPaymentsAccountId] = useState('')
  const [showAccountIdForm, setShowAccountIdForm] = useState(false)
  const [countdown, setCountdown] = useState<number>(0)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const { toast } = useToast()
  const { credentials, loading: credsLoading, addPaymentsAccountId } = useZohoCredentials()

  const handleAddPaymentsAccountId = async () => {
    if (!paymentsAccountId.trim()) {
      toast({
        title: "Invalid Account ID",
        description: "Please enter a valid Zoho Payments Account ID",
        variant: "destructive"
      })
      return
    }

    try {
      await addPaymentsAccountId(paymentsAccountId.trim())
      setPaymentsAccountId('')
      setShowAccountIdForm(false)
      toast({
        title: "Account ID Added",
        description: "Zoho Payments Account ID has been added successfully",
      })
    } catch (error) {
      console.error('Error adding payments account ID:', error)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/zoho/test-connection`)
      const result = await response.json()
      
      setConnectionStatus(result)
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Zoho connection is working properly",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to Zoho",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error testing Zoho connection:', error)
      setConnectionStatus({
        success: false,
        message: 'Failed to test connection',
        booksStatus: 'failed',
        paymentsStatus: 'failed',
        error: 'Network error'
      })
      toast({
        title: "Connection Error",
        description: "Failed to test Zoho connection",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/zoho/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Token Refreshed",
          description: "Zoho access token has been refreshed successfully",
        })
        // Test connection again after refreshing token
        await testConnection()
        // Wait a moment for the backend to update the database
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh auto-refresh status
        await fetchAutoRefreshStatus()
      } else {
        toast({
          title: "Token Refresh Failed",
          description: result.message || "Failed to refresh Zoho access token",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error refreshing Zoho token:', error)
      toast({
        title: "Token Refresh Error",
        description: "Failed to refresh Zoho access token",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  const fetchAutoRefreshStatus = async () => {
    setRefreshingStatus(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/zoho/auto-refresh-status`)
      const result = await response.json()
      
      if (result.success) {
        setAutoRefreshStatus(result)
        
        // Calculate countdown based on actual last refresh time from database
        if (result.lastRefreshTime) {
          const lastRefreshTime = new Date(result.lastRefreshTime).getTime()
          const now = Date.now()
          const refreshIntervalMs = result.refreshInterval * 60 * 1000 // Convert minutes to milliseconds
          const threeMinutesMs = 3 * 60 * 1000 // 3 minutes buffer
          
          // Calculate when the next refresh should happen (last refresh + interval - 3 minutes buffer)
          const nextRefreshTime = lastRefreshTime + refreshIntervalMs - threeMinutesMs
          const timeUntilNextRefresh = Math.max(0, nextRefreshTime - now)
          
          console.log('Countdown calculation:', {
            lastRefreshTime: new Date(lastRefreshTime).toISOString(),
            now: new Date(now).toISOString(),
            refreshInterval: result.refreshInterval,
            nextRefreshTime: new Date(nextRefreshTime).toISOString(),
            timeUntilNextRefresh: Math.floor(timeUntilNextRefresh / 60000), // in minutes
            countdownSeconds: Math.floor(timeUntilNextRefresh / 1000)
          })
          
          setCountdown(Math.floor(timeUntilNextRefresh / 1000)) // Convert to seconds
        } else {
          setCountdown(result.timeUntilNextRefresh * 60) // Fallback to backend calculation
        }
      } else {
        console.error('Auto-refresh status fetch failed:', result.message)
      }
    } catch (error) {
      console.error('Error fetching auto-refresh status:', error)
      // Set a default status if the API is not available
      setAutoRefreshStatus({
        success: false,
        autoRefreshEnabled: false,
        refreshInterval: 60,
        nextRefreshTime: new Date().toISOString(),
        timeUntilNextRefresh: 0,
        lastRefreshTime: new Date().toISOString()
      })
    } finally {
      setRefreshingStatus(false)
    }
  }

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Refresh the status when countdown reaches 0
            fetchAutoRefreshStatus()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [countdown])

  // Recalculate countdown every 30 seconds to keep it accurate
  useEffect(() => {
    if (autoRefreshStatus?.lastRefreshTime) {
      const interval = setInterval(() => {
        const lastRefreshTime = new Date(autoRefreshStatus.lastRefreshTime).getTime()
        const now = Date.now()
        const refreshIntervalMs = autoRefreshStatus.refreshInterval * 60 * 1000
        const threeMinutesMs = 3 * 60 * 1000
        
        const nextRefreshTime = lastRefreshTime + refreshIntervalMs - threeMinutesMs
        const timeUntilNextRefresh = Math.max(0, nextRefreshTime - now)
        
        setCountdown(Math.floor(timeUntilNextRefresh / 1000))
      }, 30000) // Recalculate every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefreshStatus])

  // Calculate next refresh time based on last refresh time
  const calculateNextRefreshTime = (lastRefreshTime: string, refreshInterval: number) => {
    const lastRefresh = new Date(lastRefreshTime).getTime()
    const refreshIntervalMs = refreshInterval * 60 * 1000
    const threeMinutesMs = 3 * 60 * 1000
    
    return new Date(lastRefresh + refreshIntervalMs - threeMinutesMs)
  }

  // Format countdown time
  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  useEffect(() => {
    // Test connection on page load
    testConnection()
    // Fetch auto-refresh status on page load
    fetchAutoRefreshStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <AdminLayout>
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Zoho Connection Test</h1>
        <p className="text-muted-foreground">
          Test and manage your Zoho Books and Zoho Pay integration
        </p>
      </div>

      <div className="grid gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="h-5 w-5 mr-2" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {connectionStatus.success ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <span className="font-medium">
                      {connectionStatus.success ? 'Connected' : 'Connection Failed'}
                    </span>
                  </div>
                  <Button
                    onClick={testConnection}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Wifi className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {connectionStatus.message}
                </p>

                {connectionStatus.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {typeof connectionStatus.error === 'object' 
                        ? (connectionStatus.error.message || connectionStatus.error.code || 'Unknown error')
                        : connectionStatus.error}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Service Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Zoho Books</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(connectionStatus.booksStatus)}
                      {getStatusBadge(connectionStatus.booksStatus)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Zoho Pay</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(connectionStatus.paymentsStatus)}
                      {getStatusBadge(connectionStatus.paymentsStatus)}
                    </div>
                  </div>
                </div>

                {/* Connection Details */}
                {(connectionStatus.organizationId || connectionStatus.clientId) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Connection Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {connectionStatus.organizationId && (
                          <div>
                            <span className="text-muted-foreground">Organization ID:</span>
                            <p className="font-mono">{connectionStatus.organizationId}</p>
                          </div>
                        )}
                        {connectionStatus.clientId && (
                          <div>
                            <span className="text-muted-foreground">Client ID:</span>
                            <p className="font-mono">{connectionStatus.clientId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Testing connection...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-Refresh Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              Auto-Refresh Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {autoRefreshStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {autoRefreshStatus.autoRefreshEnabled ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <span className="font-medium">
                      {autoRefreshStatus.autoRefreshEnabled ? 'Auto-Refresh Enabled' : 'Auto-Refresh Disabled'}
                    </span>
                  </div>
                  <Button
                    onClick={fetchAutoRefreshStatus}
                    variant="outline"
                    size="sm"
                    disabled={refreshingStatus}
                  >
                    {refreshingStatus ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                      </>
                    )}
                  </Button>
                </div>

                {autoRefreshStatus.autoRefreshEnabled && (
                  <div className="space-y-4">
                    {/* Countdown Timer */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-blue-600 mb-2">Next Token Refresh In:</p>
                        <div className="text-2xl font-bold text-blue-800 font-mono">
                          {formatCountdown(countdown)}
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          Tokens refresh 3 minutes before expiry for optimal performance
                        </p>
                      </div>
                    </div>

                    {/* Refresh Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Refresh Interval:</span>
                        <p className="font-medium">{autoRefreshStatus.refreshInterval} minutes</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Refresh:</span>
                        <p className="font-medium">
                          {new Date(autoRefreshStatus.lastRefreshTime).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Refresh:</span>
                        <p className="font-medium">
                          {calculateNextRefreshTime(autoRefreshStatus.lastRefreshTime, autoRefreshStatus.refreshInterval).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time Remaining:</span>
                        <p className="font-medium">
                          {Math.floor(countdown / 60)} minutes {countdown % 60} seconds
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!autoRefreshStatus.autoRefreshEnabled && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Auto-refresh is disabled.</strong> Tokens will need to be refreshed manually.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading auto-refresh status...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Token Management</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Refresh the Zoho access token if it has expired or you're experiencing connection issues.
                </p>
                <Button
                  onClick={refreshToken}
                  disabled={refreshing}
                  variant="outline"
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing Token...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Access Token
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Configuration</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Zoho credentials are stored securely in Firebase Firestore at <code>zohoapi/ZOHO_CRED</code>.
                </p>
                
                {/* Payments Account ID */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="payments-account-id" className="text-sm font-medium">
                      Zoho Payments Account ID
                    </Label>
                    {!showAccountIdForm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAccountIdForm(true)}
                        disabled={credsLoading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {credentials?.ZOHO_PAYMENTS_ACCOUNT_ID ? 'Update' : 'Add'}
                      </Button>
                    )}
                  </div>
                  
                  {credentials?.ZOHO_PAYMENTS_ACCOUNT_ID && !showAccountIdForm && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Account ID:</strong> {credentials.ZOHO_PAYMENTS_ACCOUNT_ID}
                      </p>
                    </div>
                  )}
                  
                  {showAccountIdForm && (
                    <div className="space-y-3 p-3 bg-gray-50 border rounded-lg">
                      <div>
                        <Input
                          id="payments-account-id"
                          placeholder="Enter Zoho Payments Account ID"
                          value={paymentsAccountId}
                          onChange={(e) => setPaymentsAccountId(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleAddPaymentsAccountId}
                          disabled={!paymentsAccountId.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAccountIdForm(false)
                            setPaymentsAccountId('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!credentials?.ZOHO_PAYMENTS_ACCOUNT_ID && !showAccountIdForm && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Missing:</strong> Zoho Payments Account ID is required for Zoho Pay integration.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Make sure your Zoho credentials are properly configured in Firebase Firestore 
                    with the following fields: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_ACCESS_TOKEN, ZOHO_REFRESH_TOKEN, 
                    ZOHO_ORGANIZATION_ID, and ZOHO_PAYMENTS_ACCOUNT_ID.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Zoho Integration Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Zoho Books
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic invoice creation</li>
                  <li>• Customer management</li>
                  <li>• Order tracking</li>
                  <li>• Financial reporting</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Zoho Pay
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Secure payment processing</li>
                  <li>• Multiple payment methods</li>
                  <li>• Refund management</li>
                  <li>• Transaction history</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  )
} 