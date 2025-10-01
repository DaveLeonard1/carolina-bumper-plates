import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Dumbbell, Package, Calendar, Mail } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { PageLayout } from "@/components/page-layout"

interface OrderConfirmationFallbackPageProps {
  searchParams: {
    order?: string
    name?: string
    email?: string
    total?: string
    weight?: string
  }
}

export default function OrderConfirmationFallbackPage({ searchParams }: OrderConfirmationFallbackPageProps) {
  const { order, name, email, total, weight } = searchParams

  if (!order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="mb-6">We couldn't find the order you're looking for.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageLayout>
      <div className="px-4 py-8" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colorUsage.buttonSecondary }}
              >
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
              PREORDER CONFIRMED!
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              Your preorder has been successfully submitted
            </p>
            <p className="text-lg font-semibold mt-2" style={{ color: colorUsage.textOnLight }}>
              Order #{order}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Details */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="text-center py-4">
                    <p className="text-lg font-semibold">Total: ${total}</p>
                    <p className="text-lg font-semibold">Weight: {weight} lbs</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    Detailed order information will be sent to your email once our database is fully connected.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Customer Information
                </h2>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold">Name:</p>
                    <p style={{ color: colorUsage.textMuted }}>{decodeURIComponent(name || "")}</p>
                  </div>

                  <div>
                    <p className="font-semibold">Email:</p>
                    <p style={{ color: colorUsage.textMuted }}>{decodeURIComponent(email || "")}</p>
                  </div>

                  <div className="mt-4 p-3 rounded" style={{ backgroundColor: colorUsage.backgroundLight }}>
                    <p className="text-sm font-semibold">📧 Confirmation Email</p>
                    <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                      A confirmation email will be sent once our database connection is restored.
                    </p>
                  </div>
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
                    style={{ backgroundColor: colorUsage.buttonSecondary }}
                  >
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="font-bold mb-2">We Collect Orders</h3>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    Your preorder is recorded. We'll reach out with updates as we approach our 10,000 lb goal.
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: colorUsage.buttonSecondary }}
                  >
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="font-bold mb-2">Invoice Sent</h3>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    Once we hit our goal, you'll receive an invoice via email. Payment is due within 7 days.
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
                    After payment, we'll schedule delivery within 2-3 weeks. You'll get advance notice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="text-center mt-8">
            <p style={{ color: colorUsage.textMuted }}>
              Questions about your order? Email us at{" "}
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
    </PageLayout>
  )
}
