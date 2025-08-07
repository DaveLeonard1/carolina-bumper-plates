"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dumbbell, Mail, Phone, MapPin } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useBusinessSettings } from "@/hooks/use-options"

export default function ContactPage() {
  // Use our centralized hook to get business settings
  const {
    businessName,
    businessEmail,
    businessPhone,
    businessAddress,
    website
  } = useBusinessSettings()
  
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
            <span className="text-xl font-bold">{businessName.toUpperCase()}</span>
          </div>
          <Link href="/">
            <Button variant="outline" className="font-semibold">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "Oswald, sans-serif" }}>
              CONTACT US
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              Questions about our Hi-Temp factory seconds? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 mt-1" style={{ color: colorUsage.textOnLight }} />
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p style={{ color: colorUsage.textMuted }}>
                        General inquiries:{" "}
                        <a
                          href={`mailto:${businessEmail}`}
                          className="font-semibold"
                          style={{ color: colorUsage.textOnLight }}
                        >
                          {businessEmail}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 mt-1" style={{ color: colorUsage.textOnLight }} />
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <p style={{ color: colorUsage.textMuted }}>
                        <a href={`tel:${businessPhone}`} className="font-semibold" style={{ color: colorUsage.textOnLight }}>
                          {businessPhone}
                        </a>
                      </p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        Monday - Friday, 9 AM - 5 PM EST
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 mt-1" style={{ color: colorUsage.textOnLight }} />
                    <div>
                      <h3 className="font-semibold mb-1">Location</h3>
                      <p style={{ color: colorUsage.textMuted }}>{businessAddress}</p>
                      <p style={{ color: colorUsage.textMuted }}>Service Area: North Carolina and surrounding areas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-6">Quick Answers</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Are these really Hi-Temp plates?</h3>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      Yes! All plates are official Hi-Temp USA-made bumper plates with minor cosmetic blemishes.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">When do I pay?</h3>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      You'll receive an invoice once we reach our 10,000 lb batch goal. No payment required until then.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">How does delivery work?</h3>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      We deliver locally on our return route after picking up from Hi-Temp. You'll get advance notice.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Can I change my order?</h3>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      Yes, you can make changes anytime before your invoice is sent.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Link href="/#configurator">
                    <Button
                      className="w-full font-bold"
                      style={{
                        backgroundColor: colorUsage.buttonSecondary,
                        color: colorUsage.textOnDark,
                      }}
                    >
                      View All FAQs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Hours */}
          
        </div>
      </div>
    </div>
  )
}
