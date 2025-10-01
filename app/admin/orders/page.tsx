"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Eye,
  Edit,
  Package,
  Calendar,
  DollarSign,
  Scale,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Loader2,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface OrderItem {
  quantity: number
  weight: number
  price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  name?: string
  email: string
  customer_email?: string
  phone: string
  customer_phone?: string
  created_at: string
  status: string
  subtotal: number
  total_amount?: number
  total_weight: number
  order_items: OrderItem[]
  payment_status?: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkResults, setBulkResults] = useState<any>(null)
  const [showBulkDialog, setShowBulkDialog] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    setError("")
    try {
      console.log("Fetching orders from API...")
      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      const result = await response.json()

      console.log("Orders API response:", result)
      console.log(`📊 Received ${result.orders?.length || 0} orders from API`)

      if (result.success) {
        // Check for duplicates in the UI
        const orderNumbers = result.orders?.map((o: Order) => o.order_number) || []
        const uniqueOrderNumbers = new Set(orderNumbers)
        if (orderNumbers.length !== uniqueOrderNumbers.size) {
          console.warn(`⚠️ UI received duplicate orders! Total: ${orderNumbers.length}, Unique: ${uniqueOrderNumbers.size}`)
        }
        
        setOrders(result.orders || [])
      } else {
        setError(result.error || "Failed to load orders")
        console.error("Orders API error:", result)
      }
    } catch (error) {
      console.error("Orders fetch error:", error)
      setError("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  // Add this function after the existing fetchOrders function
  const refreshOrderData = async () => {
    console.log("🔄 Refreshing order data...")
    await fetchOrders()
  }

  const handleBulkCreatePaymentLinks = async () => {
    setBulkLoading(true)
    setBulkProgress(0)
    setBulkResults(null)

    try {
      console.log("Starting bulk payment link creation...")
      const response = await fetch("/api/admin/bulk-create-payment-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: {
            unpaidOnly: true,
          },
        }),
      })

      const result = await response.json()
      setBulkProgress(100)

      if (result.success) {
        setBulkResults(result)
        // Refresh the orders list
        await fetchOrders()
      } else {
        console.error("Bulk payment link creation failed:", result.error)
        alert(`Failed to create payment links: ${result.error}`)
      }
    } catch (error) {
      console.error("Bulk payment link creation error:", error)
      alert("Failed to create payment links")
    } finally {
      setBulkLoading(false)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.email || order.customer_email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Update the getStatusColor function to handle payment status
  const getStatusColor = (status: string, paymentStatus?: string) => {
    // If payment is confirmed, show as paid regardless of status
    if (paymentStatus === "paid") {
      return "bg-green-100 text-green-800 border-green-200"
    }

    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "invoiced":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
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
                ORDERS MANAGEMENT
              </h1>
              <p className="text-base md:text-xl" style={{ color: "#1a1a1a" }}>
                View and manage all customer orders
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                onClick={fetchOrders}
                disabled={loading}
                className="border-2 border-black font-bold bg-transparent hover:bg-gray-100 text-black"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                REFRESH
              </Button>
              <Button
                onClick={() => setShowBulkDialog(true)}
                disabled={loading || orders.length === 0}
                className="font-black"
                style={{ backgroundColor: "#B9FF16", color: "#000", fontFamily: "Oswald, sans-serif" }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                CREATE PAYMENT LINKS
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL ORDERS
                  </h3>
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {orders.length}
                </div>
                <p className="text-xs text-gray-600">All orders</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    PENDING
                  </h3>
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {orders.filter((o) => o.status === "pending").length}
                </div>
                <p className="text-xs text-gray-600">Awaiting payment</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL VALUE
                  </h3>
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  ${orders.reduce((sum, order) => sum + (order.subtotal || order.total_amount || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-600">All orders combined</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL WEIGHT
                  </h3>
                  <Scale className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {orders.reduce((sum, order) => sum + (order.total_weight || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-600">lbs total</p>
              </div>
            </div>
          </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: colorUsage.textMuted }}
              />
              <Input
                placeholder="Search orders by number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                <p className="text-sm text-red-800 font-medium">Error loading orders:</p>
                <p className="text-sm text-red-700">{error}</p>
                <Button onClick={fetchOrders} className="mt-2" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: colorUsage.textOnLight }}
              ></div>
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
              <h4 className="text-lg font-semibold mb-2">No Orders Found</h4>
              <p style={{ color: colorUsage.textMuted }}>
                {searchTerm ? "No orders match your search criteria." : "No orders have been placed yet."}
              </p>
              {!searchTerm && (
                <div className="mt-4 text-sm" style={{ color: colorUsage.textMuted }}>
                  <p>Expected orders: 2</p>
                  <p>API returned: {orders.length} orders</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name || order.name || "Unknown"}</p>
                          <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                            {order.email || order.customer_email || "No email"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {/* Update the status badge in the table to show payment status priority */}
                        <Badge className={getStatusColor(order.status, order.payment_status)}>
                          {order.payment_status === "paid"
                            ? "PAID"
                            : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.total_weight || 0} lbs</TableCell>
                      <TableCell className="font-medium">
                        ${(order.subtotal || order.total_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                          <Link href={`/modify-order?order=${order.order_number}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
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
      {/* Bulk Payment Links Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Create Payment Links for Unpaid Orders
            </DialogTitle>
            <DialogDescription>
              This will create payment links for all orders with pending or unpaid status. Orders that already have
              payment links will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!bulkResults && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Orders to Process:</h4>
                <p className="text-sm text-gray-600">
                  {
                    orders.filter(
                      (o) => (o.status === "pending" || o.status === "invoiced") && o.payment_status !== "paid",
                    ).length
                  }{" "}
                  orders will be processed
                </p>
              </div>
            )}

            {bulkLoading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating payment links...</span>
                </div>
                <Progress value={bulkProgress} className="w-full" />
              </div>
            )}

            {bulkResults && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{bulkResults.summary.successful}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">{bulkResults.summary.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">{bulkResults.summary.skipped}</div>
                    <div className="text-sm text-yellow-700">Skipped</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{bulkResults.summary.total}</div>
                    <div className="text-sm text-blue-700">Total</div>
                  </div>
                </div>

                {bulkResults.results.filter((r: any) => !r.success).length > 0 && (
                  <div className="max-h-40 overflow-y-auto">
                    <h4 className="font-medium mb-2 text-red-600">Failed Orders:</h4>
                    {bulkResults.results
                      .filter((r: any) => !r.success)
                      .map((result: any) => (
                        <div key={result.orderId} className="text-sm p-2 bg-red-50 rounded mb-1">
                          <strong>#{result.orderNumber}:</strong> {result.error}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!bulkResults ? (
              <>
                <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkCreatePaymentLinks} disabled={bulkLoading}>
                  {bulkLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Create Payment Links
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowBulkDialog(false)
                  setBulkResults(null)
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  )
}
