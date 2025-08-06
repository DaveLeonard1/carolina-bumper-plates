"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, User, MapPin, Phone, Mail, Calendar, DollarSign, Scale, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react'
import { colorUsage } from "@/lib/colors"
import { OrderTimeline } from "@/components/admin/order-timeline"
import { EnhancedOrderActions } from "@/components/admin/enhanced-order-actions"
import Link from "next/link"

interface OrderItem {
  quantity: number
  weight: number
  price: number
  image_url?: string
}

interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}

interface TimelineEvent {
  id: number
  event_type: string
  event_description: string
  event_data: any
  created_by: string
  created_at: string
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  first_name?: string
  last_name?: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  delivery_instructions?: string
  delivery_option?: string
  additional_notes?: string
  order_items: OrderItem[]
  subtotal: number
  total_weight: number
  status: string
  tracking_number?: string
  shipping_method?: string
  invoice_sent_at?: string
  paid_at?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  admin_notes?: string
  stripe_customer_id?: string
  stripe_invoice_id?: string
  stripe_invoice_url?: string
  stripe_invoice_pdf?: string
  stripe_payment_intent_id?: string
  invoice_status?: string
  payment_status?: string
  created_at: string
  updated_at: string
  customer?: Customer
  timeline: TimelineEvent[]
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchOrderDetails = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`)
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API response error:", response.status, errorText)
        setError(`Failed to load order details (${response.status})`)
        return
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("Non-JSON response:", responseText)
        setError("Server returned invalid response format")
        return
      }

      const result = await response.json()

      if (result.success) {
        setOrder(result.order)
      } else {
        setError(result.error || "Failed to load order details")
      }
    } catch (error) {
      console.error("Order detail fetch error:", error)
      if (error instanceof SyntaxError) {
        setError("Server returned invalid data format")
      } else {
        setError("Failed to connect to server")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails()
    }
  }, [params.id])

  const getStatusColor = (status: string, paymentStatus?: string) => {
    // Priority: If payment is confirmed, show as paid
    if (paymentStatus === "paid") {
      return "bg-green-100 text-green-800 border-green-200"
    }

    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "invoiced":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set"
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: colorUsage.textOnLight }}
          ></div>
          <p>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p style={{ color: colorUsage.textMuted }}>{error}</p>
            <Button onClick={fetchOrderDetails} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
              Order #{order.order_number}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <Badge className={`${getStatusColor(order.status, order.payment_status)} border font-medium`}>
                {order.payment_status === "paid"
                  ? "PAID"
                  : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              {order.payment_status === "paid" && (
                <Badge className="bg-green-100 text-green-800 border-green-200">Payment Confirmed</Badge>
              )}
              <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                Created {formatDate(order.created_at)}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={fetchOrderDetails} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Payment Confirmation Alert */}
      {order.payment_status === "paid" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Payment Received</h3>
                <p className="text-sm text-green-700">
                  This order has been paid in full{order.paid_at && ` on ${formatDate(order.paid_at)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Contact Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" style={{ color: colorUsage.textMuted }} />
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" style={{ color: colorUsage.textMuted }} />
                      <span>{order.customer_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" style={{ color: colorUsage.textMuted }} />
                      <span>{order.customer_phone}</span>
                    </div>
                  </div>
                </div>
                {(order.street_address || order.city || order.state || order.zip_code) && (
                  <div>
                    <h4 className="font-medium mb-2">Delivery Address</h4>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5" style={{ color: colorUsage.textMuted }} />
                      <div>
                        {order.street_address && <div>{order.street_address}</div>}
                        {(order.city || order.state || order.zip_code) && (
                          <div>
                            {order.city}
                            {order.city && order.state && ", "}
                            {order.state} {order.zip_code}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(order.delivery_instructions || order.additional_notes) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {order.delivery_instructions && (
                      <div>
                        <h4 className="font-medium mb-1">Delivery Instructions</h4>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          {order.delivery_instructions}
                        </p>
                      </div>
                    )}
                    {order.additional_notes && (
                      <div>
                        <h4 className="font-medium mb-1">Additional Notes</h4>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          {order.additional_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(order.order_items) && order.order_items.length > 0 ? (
                <div className="space-y-4">
                  {order.order_items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ backgroundColor: colorUsage.backgroundLight }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <img
                            src={
                              item.image_url ||
                              `/placeholder.svg?height=48&width=48&query=${item.weight || "unknown"}lb+bumper+plate`
                            }
                            alt={`${item.weight}lb Bumper Plate`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `/placeholder.svg?height=48&width=48&query=${item.weight}lb+bumper+plate`
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{item.weight}lb Bumper Plate</h4>
                          <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                            Quantity: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.price.toFixed(2)}</p>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          ${(item.price / item.quantity).toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Weight:</span>
                      <span className="font-medium">{order.total_weight} lbs</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
                  <p style={{ color: colorUsage.textMuted }}>No items found for this order</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <OrderTimeline timeline={order.timeline || []} />
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4" style={{ color: colorUsage.textMuted }} />
                  <div>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      Created
                    </p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4" style={{ color: colorUsage.textMuted }} />
                  <div>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      Total Amount
                    </p>
                    <p className="font-medium">${order.subtotal.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Scale className="h-4 w-4" style={{ color: colorUsage.textMuted }} />
                  <div>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      Total Weight
                    </p>
                    <p className="font-medium">{order.total_weight} lbs</p>
                  </div>
                </div>
              </div>

              {/* Status Timestamps */}
              <Separator />
              <div className="space-y-2 text-sm">
                {order.invoice_sent_at && (
                  <div className="flex justify-between">
                    <span style={{ color: colorUsage.textMuted }}>Invoice Sent:</span>
                    <span>{formatDate(order.invoice_sent_at)}</span>
                  </div>
                )}
                {order.paid_at && (
                  <div className="flex justify-between">
                    <span style={{ color: colorUsage.textMuted }}>Paid:</span>
                    <span>{formatDate(order.paid_at)}</span>
                  </div>
                )}
                {order.cancelled_at && (
                  <div className="flex justify-between">
                    <span style={{ color: colorUsage.textMuted }}>Cancelled:</span>
                    <span>{formatDate(order.cancelled_at)}</span>
                  </div>
                )}
              </div>

              {/* Stripe Invoice Information */}
              {(order.stripe_invoice_url || order.invoice_status === "sent") && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <h4 className="font-medium">Invoice Information</h4>
                    <div className="flex justify-between">
                      <span style={{ color: colorUsage.textMuted }}>Invoice Status:</span>
                      <Badge
                        className={
                          order.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }
                      >
                        {order.payment_status === "paid" ? "Paid" : order.invoice_status || "Not Sent"}
                      </Badge>
                    </div>
                    {order.stripe_invoice_url && (
                      <div className="flex justify-between">
                        <span style={{ color: colorUsage.textMuted }}>Stripe Invoice:</span>
                        <a
                          href={order.stripe_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View Invoice
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Payment Information */}
              {order.payment_status === "paid" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Payment Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: colorUsage.textMuted }}>Payment Status:</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">PAID IN FULL</Badge>
                      </div>
                      {order.paid_at && (
                        <div className="flex justify-between">
                          <span style={{ color: colorUsage.textMuted }}>Payment Date:</span>
                          <span className="font-medium">{formatDate(order.paid_at)}</span>
                        </div>
                      )}
                      {order.stripe_payment_intent_id && (
                        <div className="flex justify-between">
                          <span style={{ color: colorUsage.textMuted }}>Payment ID:</span>
                          <span className="font-mono text-xs">{order.stripe_payment_intent_id.slice(-8)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Actions */}
          <EnhancedOrderActions order={order} onOrderUpdate={fetchOrderDetails} />
        </div>
      </div>
    </div>
  )
}
