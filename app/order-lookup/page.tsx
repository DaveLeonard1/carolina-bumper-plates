"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, AlertCircle, Package, Calendar, MapPin, DollarSign } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { PageLayout } from "@/components/page-layout"

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setOrder(null)

    try {
      const response = await fetch("/api/lookup-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber, email }),
      })

      const data = await response.json()

      if (data.success && data.order) {
        setOrder(data.order)
      } else {
        setError(data.error || "Order not found. Please check your order number and email.")
      }
    } catch (err) {
      console.error("Error looking up order:", err)
      setError("Failed to look up order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#f59e0b"
      case "confirmed":
        return "#10b981"
      case "invoiced":
        return "#3b82f6"
      case "paid":
        return "#8b5cf6"
      case "shipped":
        return "#06b6d4"
      case "delivered":
        return "#22c55e"
      case "cancelled":
        return "#ef4444"
      default:
        return colorUsage.textMuted
    }
  }

  return (
    <PageLayout>
      <div className="px-4 py-8" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "Oswald, sans-serif" }}>
              ORDER LOOKUP
            </h1>
            <p className="text-lg" style={{ color: colorUsage.textMuted }}>
              Enter your order number and email to view your order status
            </p>
          </div>

          {/* Lookup Form */}
          <Card className="p-6 rounded-lg border mb-8" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
            <CardContent className="pt-6">
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number *</Label>
                  <Input
                    id="orderNumber"
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="CBP-123456-ABCD"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="your@email.com"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold text-lg py-4"
                  disabled={loading}
                  style={{
                    backgroundColor: colorUsage.buttonSecondary,
                    color: colorUsage.textOnDark,
                  }}
                >
                  {loading ? (
                    "Looking up..."
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Look Up Order
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg mb-8" style={{ backgroundColor: "#fef2f2" }}>
              <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Status Card */}
              <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Order #{order.order_number}</h2>
                    <div
                      className="px-4 py-2 rounded-full font-semibold text-sm"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                      }}
                    >
                      {order.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Customer Information</h3>
                      <p className="text-sm mb-1">{order.customer_name}</p>
                      <p className="text-sm mb-1" style={{ color: colorUsage.textMuted }}>
                        {order.customer_email}
                      </p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {order.customer_phone}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </h3>
                      <p className="text-sm mb-1">{order.street_address}</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {order.city}, {order.state} {order.zip_code}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">
                            {item.quantity}x {item.weight} LB Bumper Plate
                          </p>
                          <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                            Hi-Temp Factory Seconds
                          </p>
                        </div>
                        <p className="font-semibold">${(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold">${order.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: colorUsage.textMuted }}>
                      <span>Tax</span>
                      <span>Calculated on invoice</span>
                    </div>
                  </div>

                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Estimated Total</span>
                      <span className="text-lg font-bold" style={{ color: colorUsage.textOnLight }}>
                        ${order.subtotal?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 mt-0.5" style={{ color: colorUsage.textMuted }} />
                      <div>
                        <p className="font-semibold">Order Date</p>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {order.payment_status && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 mt-0.5" style={{ color: colorUsage.textMuted }} />
                        <div>
                          <p className="font-semibold">Payment Status</p>
                          <p
                            className="text-sm"
                            style={{
                              color: order.payment_status === "paid" ? "#10b981" : colorUsage.textMuted,
                            }}
                          >
                            {order.payment_status?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    )}

                    {order.delivery_instructions && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-0.5" style={{ color: colorUsage.textMuted }} />
                        <div>
                          <p className="font-semibold">Delivery Instructions</p>
                          <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                            {order.delivery_instructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center">
                <Link href="/">
                  <Button
                    size="lg"
                    className="font-bold text-lg px-8 py-4"
                    style={{
                      backgroundColor: colorUsage.buttonSecondary,
                      color: colorUsage.textOnDark,
                    }}
                  >
                    Return to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
