import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Dumbbell, Package, Calendar, Mail, Edit } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import { getOrderByNumber } from "@/lib/actions/orders"
import Link from "next/link"

interface OrderConfirmationPageProps {
  searchParams: { order?: string; orderNumber?: string; modified?: string; updated?: string }
}

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  // Support both 'order' and 'orderNumber' parameters for backward compatibility
  const orderNumber = searchParams.order || searchParams.orderNumber
  const isModified = searchParams.modified === "true"
  const isUpdated = searchParams.updated === "true"

  console.log("🔍 Order confirmation page accessed with:", { orderNumber, searchParams })

  if (!orderNumber) {
    console.log("❌ No order number provided in URL")
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="mb-6">We couldn't find the order you're looking for. No order number was provided.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("🔍 Fetching order:", orderNumber)
  const order = await getOrderByNumber(orderNumber)

  if (!order) {
    console.log("❌ Order not found in database:", orderNumber)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="mb-6">We couldn't find order #{orderNumber} in our system.</p>
            <p className="text-sm mb-6" style={{ color: colorUsage.textMuted }}>
              If you just placed this order, please wait a moment and try refreshing the page. If the problem persists,
              please contact support.
            </p>
            <div className="space-y-2">
              <Link href="/">
                <Button className="w-full">Return Home</Button>
              </Link>
              <Link href="/order-lookup">
                <Button variant="outline" className="w-full">
                  Look Up Order
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("✅ Order found:", { order_number: order.order_number, customer_name: order.customer_name })

  // Parse order items safely
  let orderItems = []
  try {
    if (typeof order.order_items === "string") {
      orderItems = JSON.parse(order.order_items)
    } else if (Array.isArray(order.order_items)) {
      orderItems = order.order_items
    }
  } catch (error) {
    console.error("Error parsing order items:", error)
    orderItems = []
  }

  // Enhanced modification check - includes payment status
  const canModify =
    !order.invoiced_at &&
    order.status === "pending" &&
    !order.order_locked &&
    !order.payment_link_url &&
    order.payment_status !== "paid"

  const isPaid = order.payment_status === "paid"

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
      {/* Header */}
      <header
        className="border-b px-4 py-4"
        style={{ backgroundColor: colorUsage.backgroundPrimary, borderColor: colorUsage.border }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8" style={{ color: colorUsage.textPrimary }} />
            <span className="text-xl font-bold">CAROLINA BUMPER PLATES</span>
          </div>
          <div className="flex gap-2">
            {canModify && (
              <Link href={`/modify-order?order=${order.order_number}`}>
                <Button variant="outline" className="font-semibold">
                  <Edit className="h-4 w-4 mr-2" />
                  Modify Order
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline" className="font-semibold">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isPaid ? "#10b981" : colorUsage.buttonSecondary }}
              >
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
              {isPaid ? "PAYMENT RECEIVED!" : isModified ? "ORDER UPDATED!" : "PREORDER CONFIRMED!"}
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              {isPaid
                ? "Your payment has been successfully processed"
                : isModified
                  ? "Your order changes have been saved successfully"
                  : "Your preorder has been successfully submitted"}
            </p>
            <p className="text-lg font-semibold mt-2" style={{ color: colorUsage.textOnLight }}>
              Order #{order.order_number}
            </p>
          </div>

          {/* Payment Confirmation Notice */}
          {isPaid && (
            <div className="mb-8">
              <Card className="p-4 border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm">
                      <strong>Payment Confirmed!</strong> Your payment has been received and your order is being
                      processed.
                      {order.paid_at && (
                        <span className="block mt-1">
                          Payment received on {new Date(order.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isUpdated && (
            <div className="mb-6">
              <Card className="p-4 border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm">
                      <strong>Order Updated!</strong> Your changes have been saved successfully.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modification Notice */}
          {isModified && (
            <div className="mb-8">
              <Card className="p-4 border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm">
                      <strong>Changes Saved:</strong> Your order has been updated with your latest selections and
                      information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Details */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
                </h2>

                <div className="space-y-4 mb-6">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-semibold">
                          {item.quantity}x {item.title || `${item.weight} LB Bumper Plates`}
                        </span>
                        <span className="font-semibold">${((item.quantity || 1) * (item.price || 0)).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4" style={{ color: colorUsage.textMuted }}>
                      <p>Order items information not available</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">${Number(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: colorUsage.textMuted }}>
                    <span>Tax</span>
                    <span>Calculated on invoice</span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Weight</span>
                    <span className="text-lg font-bold" style={{ color: colorUsage.textOnLight }}>
                      {Number(order.total_weight || 0).toFixed(0)} lbs
                    </span>
                  </div>
                </div>

                {/* Payment Status Display */}
                {isPaid && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Payment Received</p>
                        <p className="text-sm text-green-700">Your order is now being processed for delivery</p>
                      </div>
                    </div>
                  </div>
                )}

                {canModify && (
                  <div className="mt-6 pt-4 border-t">
                    <Link href={`/modify-order?order=${order.order_number}`}>
                      <Button
                        variant="outline"
                        className="w-full font-semibold"
                        style={{ borderColor: colorUsage.textOnLight, color: colorUsage.textOnLight }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modify This Order
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Delivery Information
                </h2>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold">Delivery Address:</p>
                    <p style={{ color: colorUsage.textMuted }}>
                      {order.street_address || "Address not provided"}
                      <br />
                      {order.city && order.state && order.zip_code
                        ? `${order.city}, ${order.state} ${order.zip_code}`
                        : "City, State, ZIP not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold">Contact:</p>
                    <p style={{ color: colorUsage.textMuted }}>
                      {order.customer_name || "Name not provided"}
                      <br />
                      {order.customer_email || "Email not provided"}
                      <br />
                      {order.customer_phone || "Phone not provided"}
                    </p>
                  </div>

                  {order.delivery_instructions && (
                    <div>
                      <p className="font-semibold">Delivery Instructions:</p>
                      <p style={{ color: colorUsage.textMuted }}>{order.delivery_instructions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="p-6 rounded-lg border mt-8" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                What Happens Next?
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: isPaid ? "#10b981" : colorUsage.buttonSecondary }}
                  >
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="font-bold mb-2">{isPaid ? "Order Processing" : "We Collect Orders"}</h3>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {isPaid
                      ? "Your paid order is now being prepared for delivery."
                      : "Your preorder is added to our batch. We'll reach out with updates as we approach our 10,000 lb goal."}
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: isPaid ? "#10b981" : colorUsage.buttonSecondary }}
                  >
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="font-bold mb-2">{isPaid ? "Preparation" : "Invoice Sent"}</h3>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {isPaid
                      ? "We prepare your order and coordinate with our delivery team."
                      : "Once we hit our goal, you'll receive an invoice via email. Payment is due within 7 days."}
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: colorUsage.buttonSecondary }}
                  >
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="font-bold mb-2">Delivery</h3>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {isPaid
                      ? "Your order will be delivered within 2-3 weeks. You'll get advance notice."
                      : "After payment, we'll schedule delivery within 2-3 weeks. You'll get advance notice."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Modification Notice */}
          {canModify && (
            <Card className="p-6 rounded-lg border mt-8" style={{ backgroundColor: "#f0f9ff" }}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Edit className="h-6 w-6 mt-0.5 text-blue-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">Need to Make Changes?</h3>
                    <p className="text-sm text-blue-800 mb-4">
                      You can modify your order anytime before we send your invoice. Changes include plate quantities,
                      delivery address, and contact information.
                    </p>
                    <Link href={`/modify-order?order=${order.order_number}`}>
                      <Button className="font-semibold" style={{ backgroundColor: "#3b82f6", color: "white" }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modify Order
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <div className="text-center mt-8">
            <p style={{ color: colorUsage.textMuted }}>
              {isPaid ? (
                <>
                  Questions about your order?{" "}
                  <a
                    href="mailto:orders@carolinabumperplates.com"
                    className="font-semibold"
                    style={{ color: colorUsage.textOnLight }}
                  >
                    Contact our support team
                  </a>
                </>
              ) : (
                <>
                  Need to make changes to your order?{" "}
                  <Link
                    href="/order-lookup"
                    className="font-semibold underline"
                    style={{ color: colorUsage.textOnLight }}
                  >
                    Modify your order
                  </Link>{" "}
                  before invoicing begins.
                </>
              )}
            </p>
            <p className="mt-2" style={{ color: colorUsage.textMuted }}>
              Questions? Email us at{" "}
              <a
                href="mailto:orders@carolinabumperplates.com"
                className="font-semibold"
                style={{ color: colorUsage.textOnLight }}
              >
                orders@carolinabumperplates.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
