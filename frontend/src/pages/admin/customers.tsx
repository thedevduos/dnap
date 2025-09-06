"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Search, MoreHorizontal, Eye, Mail, Ban, RefreshCw, UserCheck, UserX } from "lucide-react"
import { useCustomers } from "@/hooks/use-customers"
import { useToast } from "@/hooks/use-toast"
import { AdminLayout } from "@/components/admin/admin-layout"
import { CustomerModal } from "@/components/admin/customer-modal"
import { recalculateCustomerStats } from "@/lib/firebase-utils"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminCustomers() {
  const { customers, loading, analytics } = useCustomers()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  const handleRecalculateStats = async () => {
    setIsRecalculating(true)
    try {
      await recalculateCustomerStats()
      toast({
        title: "Stats Recalculated",
        description: "Customer order counts and totals have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate customer stats.",
        variant: "destructive",
      })
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setIsModalOpen(true)
  }

  const handleSuspendCustomer = async (customer: any) => {
    try {
      await updateDoc(doc(db, "userProfiles", customer.id), {
        suspended: true,
        suspendedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      toast({
        title: "Account Suspended",
        description: `${customer.displayName || customer.email}'s account has been suspended.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend account.",
        variant: "destructive",
      })
    }
  }

  const handleUnsuspendCustomer = async (customer: any) => {
    try {
      await updateDoc(doc(db, "userProfiles", customer.id), {
        suspended: false,
        suspendedAt: null,
        updatedAt: serverTimestamp()
      })
      toast({
        title: "Account Restored",
        description: `${customer.displayName || customer.email}'s account has been restored.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore account.",
        variant: "destructive",
      })
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === "active") {
      return matchesSearch && !customer.suspended
    } else if (activeTab === "suspended") {
      return matchesSearch && customer.suspended
    }
    return matchesSearch
  })

  const activeCustomers = customers.filter(customer => !customer.suspended)
  const suspendedCustomers = customers.filter(customer => customer.suspended)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Customers ({customers.length})</h1>
            <p className="text-gray-600">Manage customer accounts and view their activity</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRecalculateStats}
              disabled={isRecalculating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? "Recalculating..." : "Recalculate Stats"}
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCustomers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-red-600">{suspendedCustomers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold">📧</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Newsletter</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.newsletter}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-bold">🛒</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Orders</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.withOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Active Customers ({activeCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="suspended" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Suspended Accounts ({suspendedCustomers.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Customers ({filteredCustomers.length})</CardTitle>
              </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No customers found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {customer.photoURL ? (
                            <img
                              src={customer.photoURL}
                              alt={customer.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {customer.displayName?.charAt(0) || customer.email?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{customer.displayName || "N/A"}</p>
                            {customer.preferences?.newsletter && (
                              <Badge variant="outline" className="text-xs">Newsletter</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {customer.orderCount || 0} orders
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{customer.totalSpent || 0}
                      </TableCell>
                      <TableCell>
                        {customer.createdAt?.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleSuspendCustomer(customer)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>
          
          <TabsContent value="suspended">
            <Card>
              <CardHeader>
                <CardTitle>Suspended Accounts ({filteredCustomers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading customers...</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No suspended accounts found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Suspended Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {customer.photoURL ? (
                                <img
                                  src={customer.photoURL}
                                  alt={customer.displayName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="text-xs font-medium text-red-600">
                                    {customer.displayName?.charAt(0) || customer.email?.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{customer.displayName || "N/A"}</p>
                                <Badge variant="destructive" className="text-xs">Suspended</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {customer.orderCount || 0} orders
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{customer.totalSpent || 0}
                          </TableCell>
                          <TableCell>
                            {customer.suspendedAt?.toDate().toLocaleDateString() || "N/A"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={() => handleUnsuspendCustomer(customer)}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Restore Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CustomerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        customer={selectedCustomer}
      />
    </AdminLayout>
  )
}