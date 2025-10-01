"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Package, Calendar, Mail, Phone } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import { PageLayout } from "@/components/page-layout"

export default function OrderConfirmationPreviewPage() {
  const orderNumber = "PY-1001"
  const order = {
    order_number: "PY-1001",
    customer_name: "John Smith",
    customer_email: "john.smith@example.com",
    customer_phone: "(555) 123-4567",
    street_address: "123 Fitness Lane",
    city: "Charlotte",
    state: "NC",
    zip_code: "28202",
    subtotal: 150.0,
    status: "pending",
    order_items: [
      {
        id: 1,
        product_id: 7,
        quantity: 2,
        weight: 5,
        price: 10.0,
        title: "5lb Bumper Plate",
      },
      {
        id: 2,
        product_id: 8,
        quantity: 3,
        weight: 10,
        price: 20.0,
        title: "10lb Bumper Plate",
      },
      {
        id: 3,
        product_id: 9,
        quantity: 2,
        weight: 25,
        price: 25.0,
        title: "25lb Bumper Plate",
      },
    ],
  }

  const orderItems = order.order_items || []
  const totalWeight = orderItems.reduce((sum, item) => sum + item.quantity * item.weight * 2, 0)

  return (
    <PageLayout>
      <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
        {/* Preview Banner */}
        <div className="px-4 py-3" style={{ backgroundColor: colorUsage.accent }}>
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-bold" style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnAccent }}>
              🎨 PREVIEW MODE - Design Testing with Mock Data
            </p>
          </div>
        </div>

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
                    {orderItems.map((item, index) => (
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
    </PageLayout>
  )
}
