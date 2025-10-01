"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Package,
  MapPin,
  Truck,
  Calendar,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileText,
  AlertCircle,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"

interface OrderItem {
  weight: number
  quantity: number
  price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  street_address: string
  city: string
  state: string
  zip_code: string
  delivery_instructions?: string
  order_items: OrderItem[]
  total_weight: number
  subtotal: number
  status: string
  payment_status: string
  paid_at: string
}

interface ProductAggregate {
  weight: number
  totalQuantity: number
  orderCount: number
}

export default function DeliveryManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorNotes, setVendorNotes] = useState("")
  const [orderReadyDate, setOrderReadyDate] = useState("")
  const [bulkUpdating, setBulkUpdating] = useState(false)

  useEffect(() => {
    fetchPaidOrders()
  }, [])

  const fetchPaidOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/delivery-orders")
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders || [])
      } else {
        console.error("Failed to fetch orders:", data.error)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  // Aggregate products by weight
  const aggregateProducts = (): ProductAggregate[] => {
    const productMap = new Map<number, ProductAggregate>()

    orders.forEach((order) => {
      if (Array.isArray(order.order_items)) {
        order.order_items.forEach((item) => {
          const existing = productMap.get(item.weight) || {
            weight: item.weight,
            totalQuantity: 0,
            orderCount: 0,
          }

          productMap.set(item.weight, {
            weight: item.weight,
            totalQuantity: existing.totalQuantity + item.quantity,
            orderCount: existing.orderCount + 1,
          })
        })
      }
    })

    return Array.from(productMap.values()).sort((a, b) => b.weight - a.weight)
  }

  const productTotals = aggregateProducts()
  const totalOrders = orders.length
  const totalWeight = orders.reduce((sum, order) => sum + (order.total_weight || 0), 0)
  const totalRevenue = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0)

  const handleBulkConfirm = async () => {
    if (!confirm(`Mark all ${totalOrders} paid orders as "Confirmed"?`)) return

    setBulkUpdating(true)
    try {
      const response = await fetch("/api/admin/bulk-confirm-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: orders.map((o) => o.id),
          notes: vendorNotes,
          readyDate: orderReadyDate,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Successfully confirmed ${result.confirmedCount} orders!`)
        fetchPaidOrders()
      } else {
        alert(`Failed to confirm orders: ${result.error}`)
      }
    } catch (error) {
      console.error("Bulk confirm error:", error)
      alert("Failed to confirm orders")
    } finally {
      setBulkUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="px-4 py-8 md:py-16 bg-white border-b-2 border-black">
          <div className="max-w-7xl mx-auto">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-black"
              style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
            >
              DELIVERY MANAGEMENT
            </h1>
          </div>
        </div>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="px-4 py-8 md:py-16 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4"
                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
              >
                DELIVERY MANAGEMENT
              </h1>
              <p className="text-base md:text-xl" style={{ color: "#1a1a1a" }}>
                Vendor ordering and delivery coordination
              </p>
            </div>
            <Button
              onClick={fetchPaidOrders}
              disabled={loading}
              className="border-2 border-black font-bold bg-transparent hover:bg-gray-100 text-black w-full md:w-auto"
              style={{ fontFamily: "Oswald, sans-serif" }}
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
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    PAID ORDERS
                  </h3>
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-3xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {totalOrders}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL WEIGHT
                  </h3>
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-3xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {totalWeight.toLocaleString()} lbs
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL REVENUE
                  </h3>
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-3xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    PRODUCTS
                  </h3>
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-3xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {productTotals.length}
                </p>
                <p className="text-xs text-gray-600">Unique weights</p>
              </div>
            </div>
          </div>

          {/* Product Totals for Vendor */}
          <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
            <div className="bg-black text-white p-4">
              <h3 className="text-sm md:text-base font-black flex items-center gap-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                <Package className="h-4 w-4 md:h-5 md:w-5" />
                VENDOR ORDER SUMMARY
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {productTotals.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-3">Product Quantities Needed:</h4>
                    <div className="flex flex-wrap gap-3">
                      {productTotals.map((product) => (
                        <div
                          key={product.weight}
                          className="bg-black text-white px-4 py-3 rounded-lg"
                        >
                          <p className="text-2xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                            {product.totalQuantity}x
                          </p>
                          <p className="text-sm">{product.weight}lb plates</p>
                          <p className="text-xs opacity-75">{product.orderCount} orders</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-bold mb-2">Quick Copy Format:</p>
                    <div className="p-3 bg-gray-100 rounded font-mono text-sm">
                      {productTotals.map((p) => `${p.totalQuantity}x ${p.weight}lb`).join(", ")}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No paid orders found</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Order Notes */}
          {totalOrders > 0 && (
            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <h3 className="text-sm md:text-base font-black flex items-center gap-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                  VENDOR ORDER DETAILS
                </h3>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <Label htmlFor="ready-date" className="font-bold">
                    Order Ready Date
                  </Label>
                  <Input
                    id="ready-date"
                    type="date"
                    value={orderReadyDate}
                    onChange={(e) => setOrderReadyDate(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="vendor-notes" className="font-bold">
                    Vendor Notes
                  </Label>
                  <Textarea
                    id="vendor-notes"
                    placeholder="Add notes about this vendor order batch..."
                    value={vendorNotes}
                    onChange={(e) => setVendorNotes(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleBulkConfirm}
                  disabled={bulkUpdating}
                  className="w-full font-black"
                  style={{ backgroundColor: "#B9FF16", color: "#000", fontFamily: "Oswald, sans-serif" }}
                >
                  {bulkUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  CONFIRM ALL {totalOrders} ORDERS
                </Button>
                <p className="text-xs text-center text-gray-600">
                  This will mark all paid orders as "Confirmed" and add your notes
                </p>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
            <div className="bg-black text-white p-4">
              <h3 className="text-sm md:text-base font-black flex items-center gap-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                DELIVERY ORDERS ({totalOrders})
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-black transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link href={`/admin/orders/${order.id}`}>
                              <h4 className="font-black text-lg hover:underline" style={{ fontFamily: "Oswald, sans-serif" }}>
                                #{order.order_number}
                              </h4>
                            </Link>
                            <Badge className={order.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-green-100 text-green-800"}>
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div>
                                <p className="font-medium">{order.customer_name}</p>
                                <p className="text-gray-600">{order.street_address}</p>
                                <p className="text-gray-600">
                                  {order.city}, {order.state} {order.zip_code}
                                </p>
                              </div>
                            </div>

                            {order.delivery_instructions && (
                              <div className="ml-6 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <strong>Delivery Note:</strong> {order.delivery_instructions}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600">Order Items:</p>
                          <div className="space-y-1">
                            {Array.isArray(order.order_items) &&
                              order.order_items.map((item, idx) => (
                                <p key={idx} className="font-mono text-sm">
                                  {item.quantity}x {item.weight}lb
                                </p>
                              ))}
                          </div>
                          <p className="text-sm font-bold mt-2">{order.total_weight} lbs total</p>
                          <p className="text-lg font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                            ${order.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No paid orders ready for delivery</p>
                  <p className="text-sm text-gray-500 mt-2">Orders will appear here once they are paid</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
