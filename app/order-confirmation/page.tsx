"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2, Package, Calendar, Mail, Phone } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { PageLayout } from "@/components/page-layout"

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails(orderNumber)
    } else {
      setError("No order number provided")
      setLoading(false)
    }
  }, [orderNumber])

  const fetchOrderDetails = async (orderNum: string) => {
    try {
      const response = await fetch(`/api/get-order/${orderNum}`)
      const data = await response.json()

      if (data.success && data.order) {
        setOrder(data.order)
      } else {
        setError(data.error || "Order not found")
      }
    } catch (err) {
      console.error("Error fetching order:", err)
      setError("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6" style={{ color: colorUsage.textMuted }} />
          <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
            LOADING ORDER DETAILS
          </h1>
          <p className="text-lg" style={{ color: colorUsage.textMuted }}>
            Please wait while we retrieve your order...
          </p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-6 text-red-500" />
          <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
            ORDER NOT FOUND
          </h1>
          <p className="text-lg mb-8" style={{ color: colorUsage.textMuted }}>
            {error || "We couldn't find your order. Please check your order number and try again."}
          </p>
          <Link href="/order-lookup">
            <Button
              size="lg"
              className="font-bold text-lg px-8 py-4"
              style={{
                backgroundColor: colorUsage.buttonSecondary,
                color: colorUsage.textOnDark,
              }}
            >
              Look Up Order
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const orderItems = order.order_items || []
  const totalWeight = orderItems.reduce((sum: number, item: any) => sum + (item.quantity * item.weight * 2 || 0), 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
      {/* Hero Section */}
      <div className="px-4 py-16" style={{ backgroundColor: colorUsage.backgroundDark }}>
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
            style={{ backgroundColor: colorUsage.accent }}
          >
            <CheckCircle className="h-14 w-14" style={{ color: colorUsage.textOnAccent }} />
          </div>
          <h1
            className="text-5xl md:text-6xl font-black mb-4"
            style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnDark }}
          >
            ORDER CONFIRMED!
          </h1>
          <p className="text-xl md:text-2xl mb-4" style={{ color: "#9ca3af" }}>
            Your preorder has been reserved
          </p>
          <div
            className="inline-block px-6 py-3 rounded-lg mt-2"
            style={{ backgroundColor: "rgba(185, 255, 22, 0.1)", border: `2px solid ${colorUsage.accent}` }}
          >
            <p className="text-sm uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>
              Order Number
            </p>
            <p className="text-2xl font-black" style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.accent }}>
              {orderNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Order Summary Card */}
          <Card
            className="overflow-hidden border-2"
            style={{ backgroundColor: colorUsage.backgroundDark, borderColor: "#2a2a2a" }}
          >
            <div className="px-6 py-4 border-b-2" style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}>
              <h2
                className="text-2xl font-black flex items-center gap-2"
                style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnDark }}
              >
                <Package className="h-6 w-6" style={{ color: colorUsage.accent }} />
                ORDER DETAILS
              </h2>
            </div>
            <CardContent className="p-6 space-y-6">
              {/* Order Items */}
              <div>
                <div className="space-y-4">
                  {orderItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border"
                      style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center font-black"
                              style={{
                                backgroundColor: "rgba(185, 255, 22, 0.1)",
                                color: colorUsage.accent,
                                fontFamily: "Oswald, sans-serif",
                              }}
                            >
                              x{item.quantity}
                            </div>
                            <div>
                              <p
                                className="font-bold text-lg"
                                style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnDark }}
                              >
                                {item.weight}LB BUMPER PLATE
                              </p>
                              <p className="text-sm" style={{ color: "#9ca3af" }}>
                                Hi-Temp Factory Seconds
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-2xl font-black"
                            style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.accent }}
                          >
                            ${(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div
                className="p-6 rounded-lg border-2"
                style={{ backgroundColor: "#1a1a1a", borderColor: colorUsage.accent }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: "#9ca3af" }}>
                      Subtotal
                    </span>
                    <span className="text-xl font-bold" style={{ color: colorUsage.textOnDark }}>
                      ${order.subtotal?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: "#9ca3af" }}>
                      Tax
                    </span>
                    <span className="text-sm" style={{ color: "#9ca3af" }}>
                      Calculated on invoice
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: "#9ca3af" }}>
                      Total Weight
                    </span>
                    <span className="text-xl font-bold" style={{ color: colorUsage.textOnDark }}>
                      {totalWeight} lbs
                    </span>
                  </div>
                  <div className="pt-3 border-t" style={{ borderColor: "#2a2a2a" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="text-xl font-black"
                        style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnDark }}
                      >
                        ESTIMATED TOTAL
                      </span>
                      <span
                        className="text-3xl font-black"
                        style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.accent }}
                      >
                        ${order.subtotal?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card
            className="overflow-hidden border-2"
            style={{ backgroundColor: colorUsage.backgroundDark, borderColor: "#2a2a2a" }}
          >
            <div className="px-6 py-4 border-b-2" style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}>
              <h2
                className="text-2xl font-black flex items-center gap-2"
                style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnDark }}
              >
                <Mail className="h-6 w-6" style={{ color: colorUsage.accent }} />
                CUSTOMER INFORMATION
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#1a1a1a" }}>
                  <p className="text-sm uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
                    Contact Details
                  </p>
                  <p className="font-bold text-lg mb-1" style={{ color: colorUsage.textOnDark }}>
                    {order.customer_name}
                  </p>
                  <p className="text-sm mb-1" style={{ color: "#d1d5db" }}>
                    {order.customer_email}
                  </p>
                  <p className="text-sm flex items-center gap-1" style={{ color: "#d1d5db" }}>
                    <Phone className="h-3 w-3" />
                    {order.customer_phone}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#1a1a1a" }}>
                  <p className="text-sm uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>
                    Delivery Address
                  </p>
                  <p className="text-sm mb-1" style={{ color: colorUsage.textOnDark }}>
                    {order.street_address}
                  </p>
                  <p className="text-sm" style={{ color: "#d1d5db" }}>
                    {order.city}, {order.state} {order.zip_code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next Card */}
          <Card
            className="overflow-hidden border-2"
            style={{ backgroundColor: colorUsage.backgroundDark, borderColor: "#2a2a2a" }}
          >
            <div className="px-6 py-4 border-b-2" style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}>
              <h2
                className="text-2xl font-black flex items-center gap-2"
                style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnDark }}
              >
                <Calendar className="h-6 w-6" style={{ color: colorUsage.accent }} />
                WHAT HAPPENS NEXT?
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  {
                    num: "1",
                    title: "Confirmation Email",
                    desc: "You'll receive a confirmation email with your complete order details",
                  },
                  {
                    num: "2",
                    title: "Weight Goal Progress",
                    desc: "We'll keep you updated as we work toward our goal weight",
                  },
                  {
                    num: "3",
                    title: "Invoice & Payment",
                    desc: "Once the goal is reached, you'll receive an invoice via email for payment",
                  },
                  {
                    num: "4",
                    title: "Delivery",
                    desc: "After payment, your plates will be delivered within 2-3 weeks",
                  },
                ].map((step) => (
                  <div key={step.num} className="flex gap-4 p-4 rounded-lg" style={{ backgroundColor: "#1a1a1a" }}>
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-black text-2xl"
                      style={{
                        backgroundColor: colorUsage.accent,
                        color: colorUsage.textOnAccent,
                        fontFamily: "Oswald, sans-serif",
                      }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <h3
                        className="font-bold text-lg mb-1"
                        style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnDark }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm" style={{ color: "#9ca3af" }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="font-bold text-lg px-8 py-4 w-full sm:w-auto"
                style={{
                  backgroundColor: colorUsage.buttonSecondary,
                  color: colorUsage.textOnDark,
                }}
              >
                Return to Home
              </Button>
            </Link>
            <Link href={`/order-lookup?order=${orderNumber}`}>
              <Button
                variant="outline"
                size="lg"
                className="font-bold text-lg px-8 py-4 w-full sm:w-auto bg-transparent"
              >
                View Order Status
              </Button>
            </Link>
          </div>

          {/* Contact CTA */}
          <div className="text-center p-8 rounded-lg" style={{ backgroundColor: colorUsage.backgroundDark }}>
            <p className="font-bold text-xl mb-3" style={{ color: colorUsage.textOnDark }}>
              Questions about your order?
            </p>
            <a
              href="mailto:orders@theplateyard.com"
              className="font-black text-xl underline"
              style={{ color: colorUsage.accent, fontFamily: "Oswald, sans-serif" }}
            >
              orders@theplateyard.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <PageLayout>
      <Suspense
        fallback={
          <div className="px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6" style={{ color: colorUsage.textMuted }} />
              <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
                LOADING...
              </h1>
            </div>
          </div>
        }
      >
        <OrderConfirmationContent />
      </Suspense>
    </PageLayout>
  )
}
