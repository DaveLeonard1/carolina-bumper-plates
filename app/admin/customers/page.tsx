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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
            Customer Management
          </h1>
          <p style={{ color: colorUsage.textMuted }}>View and manage customer accounts</p>
        </div>
        <Button onClick={fetchCustomers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8" style={{ color: colorUsage.textMuted }} />
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Total Customers
                </p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8" style={{ color: colorUsage.textMuted }} />
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Active Customers
                </p>
                <p className="text-2xl font-bold">{customers.filter((c) => c.order_count > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8" style={{ color: colorUsage.textMuted }} />
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  New This Month
                </p>
                <p className="text-2xl font-bold">
                  {
                    customers.filter((c) => {
                      const created = new Date(c.created_at)
                      const now = new Date()
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <div className="overflow-x-auto">
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
