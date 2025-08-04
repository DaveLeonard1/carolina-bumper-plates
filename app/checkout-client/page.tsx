"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Dumbbell, AlertCircle, CheckCircle } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface OrderItem {
  quantity: number
  weight: number
  price: number
}

export default function CheckoutClientPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    deliveryInstructions: "",
    deliveryOption: "door",
    additionalNotes: "",
    agreeToTerms: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock order data - in real app this would come from state/props
  const orderItems: OrderItem[] = [
    { quantity: 3, weight: 10, price: 45 },
    { quantity: 3, weight: 15, price: 55 },
  ]

  const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const totalWeight = orderItems.reduce((sum, item) => sum + item.quantity * item.weight * 2, 0) // pairs

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.agreeToTerms) {
      alert("Please agree to the terms and conditions")
      return
    }

    setIsSubmitting(true)

    try {
      // Generate a simple order number
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      const orderNumber = `CBP-${timestamp}-${random}`

      // Client-side only approach - redirect to confirmation page
      router.push(
        `/order-confirmation-fallback?order=${orderNumber}&name=${encodeURIComponent(`${formData.firstName} ${formData.lastName}`.trim())}&email=${encodeURIComponent(formData.email)}&total=${subtotal}&weight=${totalWeight}`,
      )
    } catch (error) {
      console.error("Error submitting order:", error)
      alert("There was an error submitting your order. Please try again.")
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    formData.streetAddress &&
    formData.city &&
    formData.state &&
    formData.zipCode &&
    formData.agreeToTerms

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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Client-Side Notice */}
          <div className="mb-6">
            <Card className="p-4 border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    <strong>Note:</strong> This is a client-side only version of the checkout. Your order will be
                    processed but not saved to a database.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Side - Form */}
            <div className="lg:col-span-2">
              <Card className="p-6 rounded-lg border mb-6" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                    PREORDER CHECKOUT
                  </h1>
                  <p className="mb-8" style={{ color: colorUsage.textMuted }}>
                    Complete your preorder reservation below. No payment required now.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact & Delivery Information */}
                    <div>
                      <h2 className="text-xl font-bold mb-4">Contact & Delivery Information</h2>
                      <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                        Please provide your contact details and delivery address
                      </p>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label htmlFor="streetAddress">Street Address *</Label>
                        <Input
                          id="streetAddress"
                          type="text"
                          value={formData.streetAddress}
                          onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                          required
                          className="mt-1"
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            type="text"
                            value={formData.state}
                            onChange={(e) => handleInputChange("state", e.target.value)}
                            required
                            className="mt-1"
                            placeholder="NC"
                          />
                        </div>
                      </div>

                      <div className="mb-6">
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          required
                          className="mt-1"
                          placeholder="12345"
                          className="w-32"
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Delivery & Additional Information */}
              <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4">Delivery & Additional Information</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="mb-6">
                      <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
                      <Textarea
                        id="deliveryInstructions"
                        value={formData.deliveryInstructions}
                        onChange={(e) => handleInputChange("deliveryInstructions", e.target.value)}
                        className="mt-1"
                        rows={2}
                        placeholder="Gate codes, special instructions, etc."
                      />
                    </div>

                    {/* Delivery Options */}

                    <h3 className="text-lg font-bold mb-4">Can the product be left at your address?</h3>
                    <RadioGroup
                      value={formData.deliveryOption}
                      onValueChange={(value) => handleInputChange("deliveryOption", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="door" id="door" />
                        <Label htmlFor="door">Yes, leave at door/porch</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="garage" id="garage" />
                        <Label htmlFor="garage">Yes, leave in garage/designated area</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="signature" id="signature" />
                        <Label htmlFor="signature">No, signature required</Label>
                      </div>
                    </RadioGroup>

                    {/* Additional Notes */}

                    <Label htmlFor="additionalNotes">Additional Notes (optional)</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                      className="mt-1"
                      rows={3}
                      placeholder="Any other information we should know..."
                    />

                    {/* Terms Agreement */}

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm leading-relaxed">
                        I understand this is a preorder reservation and I will receive an invoice once the weight
                        threshold is reached. I agree to the{" "}
                        <a href="#" className="underline" style={{ color: colorUsage.textOnLight }}>
                          terms and conditions
                        </a>
                        .
                      </Label>
                    </div>

                    {/* Submit Button */}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full font-bold text-lg py-4"
                      disabled={!isFormValid || isSubmitting}
                      style={{
                        backgroundColor:
                          isFormValid && !isSubmitting ? colorUsage.buttonSecondary : colorUsage.textDisabled,
                        color: colorUsage.textOnDark,
                      }}
                      onMouseEnter={(e) => {
                        if (isFormValid && !isSubmitting) {
                          e.currentTarget.style.backgroundColor = colorUsage.buttonSecondaryHover
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isFormValid && !isSubmitting) {
                          e.currentTarget.style.backgroundColor = colorUsage.buttonSecondary
                        }
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Complete Preorder Reservation"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Order Summary */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Order Summary */}
                <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                    {/* Order Items */}
                    <div className="space-y-4 mb-6">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold">
                              {item.quantity}x {item.weight} LB Bumper Plate
                            </span>
                          </div>
                          <span className="font-semibold">${(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm" style={{ color: colorUsage.textMuted }}>
                        <span>Tax</span>
                        <span>Calculated on invoice</span>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold" style={{ color: colorUsage.textOnLight }}>
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm mb-4" style={{ color: colorUsage.textMuted }}>
                        To be invoiced when weight goal is reached
                      </p>
                    </div>

                    {/* Contribution Info */}
                    <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: colorUsage.backgroundLight }}>
                      <div className="text-center">
                        <p className="font-semibold">Your Contribution</p>
                        <p className="text-2xl font-bold" style={{ color: colorUsage.textOnLight }}>
                          {totalWeight} lbs
                        </p>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Helping reach the goal!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preorder Information */}
                <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold mb-4">Preorder Information</h3>
                    <div className="space-y-4 text-sm" style={{ color: colorUsage.textMuted }}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5 text-orange-500 flex-shrink-0" />
                        <p>
                          This is a preorder reservation. No payment will be taken now. Once we reach our 10,000 lb
                          goal, we'll email you an invoice for payment.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold" style={{ color: colorUsage.textPrimary }}>
                            Estimated Delivery
                          </p>
                          <p>2-3 weeks after payment is received and order is processed.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
