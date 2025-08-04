"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dumbbell, Search, AlertCircle } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"

export default function OrderLookupPage() {
  const [searchData, setSearchData] = useState({
    orderNumber: "",
    email: "",
  })
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSearching(true)

    try {
      const response = await fetch("/api/lookup-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchData),
      })

      const result = await response.json()

      if (result.success && result.order) {
        // Redirect to order modification page
        window.location.href = `/modify-order?order=${result.order.order_number}`
      } else {
        setError(result.error || "Order not found. Please check your order number and email address.")
      }
    } catch (error) {
      setError("There was an error looking up your order. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

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
          <Link href="/">
            <Button variant="outline" className="font-semibold">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Search className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textOnLight }} />
            <h1 className="text-4xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              FIND YOUR ORDER
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              Look up your preorder to make changes or check status
            </p>
          </div>

          <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <Label htmlFor="orderNumber">Order Number *</Label>
                  <Input
                    id="orderNumber"
                    type="text"
                    value={searchData.orderNumber}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, orderNumber: e.target.value }))}
                    required
                    className="mt-1"
                    placeholder="CBP-123456-ABCD"
                  />
                  <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                    Found in your confirmation email
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={searchData.email}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="mt-1"
                    placeholder="your@email.com"
                  />
                  <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                    Email used when placing the order
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
                    <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold text-lg py-4"
                  disabled={!searchData.orderNumber || !searchData.email || isSearching}
                  style={{
                    backgroundColor:
                      searchData.orderNumber && searchData.email && !isSearching
                        ? colorUsage.buttonSecondary
                        : colorUsage.textDisabled,
                    color: colorUsage.textOnDark,
                  }}
                >
                  {isSearching ? "Searching..." : "Find My Order"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold mb-3">Need Help?</h3>
                <div className="space-y-2 text-sm" style={{ color: colorUsage.textMuted }}>
                  <p>• Your order number was sent to your email after placing the order</p>
                  <p>• Make sure to use the same email address you used when ordering</p>
                  <p>• Orders can only be modified before invoicing begins</p>
                </div>
                <div className="mt-4">
                  <Link href="/contact">
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
