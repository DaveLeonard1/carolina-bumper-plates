"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Mail, Users, Calendar, ShoppingCart, AlertCircle, RefreshCw } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface Customer {
  id: string
  email: string
  name?: string
  first_name?: string
  last_name?: string
  phone?: string
  customer_phone?: string
  created_at: string
  last_sign_in_at?: string
  order_count: number
  total_spent: number
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    setError("")
    try {
      console.log("Fetching customers from API...")
      const response = await fetch("/api/admin/customers")
      const result = await response.json()

      console.log("Customers API response:", result)

      if (result.success) {
        setCustomers(result.customers || [])
      } else {
        setError(result.error || "Failed to load customers")
        console.error("Customers API error:", result)
      }
    } catch (error) {
      console.error("Customers fetch error:", error)
      setError("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${customer.first_name || ""} ${customer.last_name || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCustomerName = (customer: Customer) => {
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name} ${customer.last_name}`
    }
    if (customer.name) {
      return customer.name
    }
    return customer.email.split("@")[0] // Fallback to email username
  }

  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <div className="px-4 py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4"
                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
              >
                CUSTOMER MANAGEMENT
              </h1>
              <p className="text-base md:text-xl" style={{ color: "#1a1a1a" }}>
                View and manage customer accounts
              </p>
            </div>
            <Button
              onClick={fetchCustomers}
              disabled={loading}
              className="border-2 border-black font-bold bg-transparent hover:bg-gray-100 text-black w-full md:w-auto"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              REFRESH
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL CUSTOMERS
                  </h3>
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {customers.length}
                </div>
                <p className="text-xs text-gray-600">All customers</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    ACTIVE CUSTOMERS
                  </h3>
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {customers.filter((c) => c.order_count > 0).length}
                </div>
                <p className="text-xs text-gray-600">With orders</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    NEW THIS MONTH
                  </h3>
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {
                    customers.filter((c) => {
                      const created = new Date(c.created_at)
                      const now = new Date()
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                    }).length
                  }
                </div>
                <p className="text-xs text-gray-600">This month</p>
              </div>
            </div>
          </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              style={{ color: colorUsage.textMuted }}
            />
            <Input
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
              <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">Error loading customers:</p>
                <p className="text-sm text-red-700">{error}</p>
                <Button onClick={fetchCustomers} className="mt-2" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: colorUsage.textOnLight }}
              ></div>
              <p>Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
              <h4 className="text-lg font-semibold mb-2">No Customers Found</h4>
              <p style={{ color: colorUsage.textMuted }}>
                {searchTerm ? "No customers match your search criteria." : "No customers have registered yet."}
              </p>
              {!searchTerm && (
                <div className="mt-4 text-sm" style={{ color: colorUsage.textMuted }}>
                  <p>Expected customers: 2</p>
                  <p>API returned: {customers.length} customers</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white border-2 border-black rounded-lg overflow-hidden">
                    <div className="bg-black text-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>
                          {getCustomerName(customer)}
                        </span>
                        <span className="text-xs opacity-75">
                          ID: {customer.id.toString().slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>EMAIL</p>
                          <p className="text-sm break-all">{customer.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>PHONE</p>
                            <p className="text-sm">{customer.phone || customer.customer_phone || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>JOINED</p>
                            <p className="text-sm">{new Date(customer.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>ORDERS</p>
                            <p className="text-sm font-medium">{customer.order_count}</p>
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>TOTAL SPENT</p>
                            <p className="text-sm font-bold">${customer.total_spent.toFixed(2)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>LAST LOGIN</p>
                          <p className="text-sm">
                            {customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleDateString() : "Never"}
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getCustomerName(customer)}</p>
                            <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                              ID: {customer.id.toString().slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || customer.customer_phone || "N/A"}</TableCell>
                        <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell className="text-center">{customer.order_count}</TableCell>
                        <TableCell className="font-medium">${customer.total_spent.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
