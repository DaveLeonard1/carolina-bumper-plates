"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight, Home } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"

interface PaymentDetails {
  sessionId: string
  orderId: string
  orderNumber: string
  customerEmail: string
  amountPaid: number
  paymentStatus: string
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const orderId = searchParams.get("order_id")

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (sessionId && orderId) {
      fetchPaymentDetails()
    } else {
      setError("Missing payment session information")
      setLoading(false)
    }
  }, [sessionId, orderId])

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment-success?session_id=${sessionId}&order_id=${orderId}`)
      const result = await response.json()

      if (result.success) {
        setPaymentDetails(result.details)
      } else {
        setError(result.error || "Failed to verify payment")
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      setError("Failed to verify payment details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderColor: colorUsage.primary }}
            ></div>
            <p>Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Package className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: colorUsage.backgroundLight }}
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl" style={{ fontFamily: "Oswald, sans-serif" }}>
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentDetails && (
            <>
              <div className="text-center">
                <p className="text-lg mb-2">
                  Thank you for your payment of{" "}
                  <span className="font-bold">${(paymentDetails.amountPaid / 100).toFixed(2)}</span>
                </p>
                <p style={{ color: colorUsage.textMuted }}>
                  Order #{paymentDetails.orderNumber} has been paid successfully
                </p>
              </div>

              <div className="border rounded-lg p-4" style={{ backgroundColor: colorUsage.backgroundLight }}>
                <h3 className="font-semibold mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order Number:</span>
                    <span className="font-medium">#{paymentDetails.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-medium text-green-600">
                      {paymentDetails.paymentStatus === "paid" ? "Paid" : paymentDetails.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{paymentDetails.customerEmail}</span>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: colorUsage.backgroundLight }}>
                  <h4 className="font-semibold mb-2">What's Next?</h4>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    We'll process your order and send you tracking information once your bumper plates are ready for
                    pickup/delivery. You'll receive email updates at {paymentDetails.customerEmail}.
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/">
                      <Home className="h-4 w-4 mr-2" />
                      Return Home
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/my-account">
                      <Package className="h-4 w-4 mr-2" />
                      View My Orders
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
