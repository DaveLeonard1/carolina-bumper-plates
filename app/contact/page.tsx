import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactPage() {
  return (
    <PageLayout>
      <div className="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-black mb-6 text-gray-900">CONTACT US</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about your preorder? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">For general inquiries and support, reach out to us at:</p>
                <a
                  href="mailto:support@carolinabumperplates.com"
                  className="text-lg font-semibold hover:underline"
                  style={{ color: "#6EBA5E" }}
                >
                  support@carolinabumperplates.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Need help with your order? Check your order status or make changes:
                </p>
                <a href="/order-lookup" className="text-lg font-semibold hover:underline" style={{ color: "#6EBA5E" }}>
                  Manage Your Order →
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Monday - Friday: 9:00 AM - 5:00 PM EST
                  <br />
                  Saturday - Sunday: Closed
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
