"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ShoppingCart,
  UserPlus,
  LogIn,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { supabase } from "@/lib/supabase/client"
import { getCartFromStorage, clearCartFromStorage, type CartItem } from "@/lib/cart-storage"
import { PageLayout } from "@/components/page-layout"

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
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

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotals, setCartTotals] = useState({
    subtotal: 0,
    totalWeight: 0,
    totalSavings: 0,
  })
  const [cartLoading, setCartLoading] = useState(true)

  const [emailStatus, setEmailStatus] = useState("unchecked")
  const [authMode, setAuthMode] = useState("none")
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const { user } = useAuth()

  useEffect(() => {
    console.log("=== CHECKOUT PAGE MOUNT ===")
    console.log("🛒 CheckoutPage: Component mounted, loading cart data...")
    console.log("🔍 sessionStorage available:", typeof sessionStorage !== "undefined")

    setCartLoading(true)

    setTimeout(() => {
      try {
        console.log("📖 Attempting to load cart from storage...")
        const cartData = getCartFromStorage()
        console.log("📦 Cart data from storage:", cartData)

        if (cartData && cartData.items && Array.isArray(cartData.items) && cartData.items.length > 0) {
          console.log("✅ CheckoutPage: Cart loaded successfully:", {
            itemCount: cartData.items.length,
            subtotal: cartData.subtotal,
            totalWeight: cartData.totalWeight,
          })

          setCartItems(cartData.items)
          setCartTotals({
            subtotal: cartData.subtotal || 0,
            totalWeight: cartData.totalWeight || 0,
            totalSavings: cartData.totalContribution || 0,
          })
        } else {
          console.log("⚠️ CheckoutPage: No valid cart data found")
          setCartItems([])
          setCartTotals({
            subtotal: 0,
            totalWeight: 0,
            totalSavings: 0,
          })
        }
      } catch (error) {
        console.error("❌ CheckoutPage: Error loading cart:", error)
        setCartItems([])
        setCartTotals({
          subtotal: 0,
          totalWeight: 0,
          totalSavings: 0,
        })
      } finally {
        setCartLoading(false)
      }
    }, 100)
  }, [])

  useEffect(() => {
    if (user) {
      console.log("👤 CheckoutPage: User already signed in:", user.email)
      setIsSignedIn(true)
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
      }))
      setEmailStatus("exists")
      setAuthMode("none")
    }
  }, [user])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSubmitError("")

    if (field === "email" && !user) {
      setEmailStatus("unchecked")
      setAuthError("")
      setIsSignedIn(false)
      setAuthMode("none")
    }
  }

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes("@") || user) return

    console.log("📧 CheckoutPage: Checking email exists:", email)
    setEmailStatus("checking")
    setAuthError("")

    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      console.log("📧 CheckoutPage: Email check result:", result)

      if (result.success) {
        if (result.exists) {
          setEmailStatus("exists")
          setAuthMode("login")
        } else {
          setEmailStatus("new")
          setAuthMode("signup")
        }
      } else {
        setEmailStatus("new")
        setAuthMode("signup")
      }
    } catch (error) {
      console.error("❌ CheckoutPage: Error checking email:", error)
      setEmailStatus("new")
      setAuthMode("signup")
    }
  }

  const handleSignIn = async () => {
    console.log("🔐 CheckoutPage: Attempting sign in...")
    setIsSigningIn(true)
    setAuthError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        console.error("❌ CheckoutPage: Sign in error:", error)
        setAuthError(error.message)
      } else {
        console.log("✅ CheckoutPage: Sign in successful")
        setIsSignedIn(true)
        setAuthMode("none")
        setFormData((prev) => ({ ...prev, password: "" }))
      }
    } catch (error) {
      console.error("❌ CheckoutPage: Unexpected sign in error:", error)
      setAuthError("An unexpected error occurred during sign in")
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleEmailBlur = () => {
    if (formData.email && emailStatus === "unchecked" && !user) {
      checkEmailExists(formData.email)
    }
  }

  const validateForm = () => {
    const errors = []

    if (!formData.firstName.trim()) errors.push("First name is required")
    if (!formData.lastName.trim()) errors.push("Last name is required")
    if (!formData.email.trim()) errors.push("Email is required")
    if (!formData.phone.trim()) errors.push("Phone number is required")
    if (!formData.streetAddress.trim()) errors.push("Street address is required")
    if (!formData.city.trim()) errors.push("City is required")
    if (!formData.state.trim()) errors.push("State is required")
    if (!formData.zipCode.trim()) errors.push("ZIP code is required")
    if (!formData.agreeToTerms) errors.push("You must agree to the terms and conditions")
    if (cartItems.length === 0) errors.push("Your cart is empty")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("Please enter a valid email address")
    }

    if (!user && !isSignedIn) {
      if (authMode === "signup" && (!formData.password || formData.password.length < 6)) {
        errors.push("Password must be at least 6 characters long for new accounts")
      }
      if (authMode === "login" && !formData.password) {
        errors.push("Password is required to sign in")
      }
      if (authMode === "none" && emailStatus !== "unchecked") {
        errors.push("Please complete the authentication process")
      }
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 CheckoutPage: Starting order submission...")

    setSubmitError("")

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(", ")
      setSubmitError(errorMessage)
      console.log("❌ CheckoutPage: Form validation failed:", validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      if (authMode === "login" && !isSignedIn && !user) {
        console.log("🔐 CheckoutPage: Signing in user first...")
        await handleSignIn()
        if (!isSignedIn) {
          setSubmitError("Please sign in before completing your order")
          setIsSubmitting(false)
          return
        }
      }

      const orderData = {
        customerName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        customerEmail: formData.email.trim().toLowerCase(),
        customerPhone: formData.phone.trim(),
        streetAddress: formData.streetAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        deliveryInstructions: formData.deliveryInstructions.trim(),
        deliveryOption: formData.deliveryOption,
        additionalNotes: formData.additionalNotes.trim(),
        orderItems: cartItems.map((item) => ({
          productId: item.productId,
          weight: item.weight,
          title: item.name,
          quantity: item.quantity,
          price: item.pricePerUnit,
          regularPrice: item.pricePerUnit * 1.5,
        })),
        subtotal: cartTotals.subtotal,
        totalWeight: cartTotals.totalWeight,
        createAccount: authMode === "signup" && !user,
        password: authMode === "signup" ? formData.password : undefined,
      }

      console.log("📤 CheckoutPage: Sending order data:", {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        itemCount: orderData.orderItems.length,
        subtotal: orderData.subtotal,
        createAccount: orderData.createAccount,
        hasPassword: !!orderData.password,
      })

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      console.log("📥 CheckoutPage: Checkout response:", result)

      if (result.success && result.orderNumber) {
        console.log("🎉 CheckoutPage: Order created successfully:", result.orderNumber)

        if (result.accountCreated) {
          console.log("✅ CheckoutPage: User account created successfully")
        }

        clearCartFromStorage()

        const redirectUrl = result.redirectUrl || `/order-confirmation?order=${result.orderNumber}`
        console.log("🔄 CheckoutPage: Redirecting to:", redirectUrl)

        window.location.href = redirectUrl
      } else {
        const errorMessage = result.error || "Unknown error occurred"
        console.error("❌ CheckoutPage: Order creation failed:", errorMessage)
        setSubmitError(`Order creation failed: ${errorMessage}`)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("💥 CheckoutPage: Checkout error:", error)
      setSubmitError("There was an error submitting your order. Please try again.")
      setIsSubmitting(false)
    }
  }

  const isFormValid = validateForm().length === 0
  const buttonBackgroundColor = isFormValid && !isSubmitting ? "#B9FF16" : colorUsage.textDisabled

  if (cartLoading) {
    return (
      <PageLayout>
        <div className="px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <RefreshCw className="h-16 w-16 animate-spin mx-auto mb-6" style={{ color: colorUsage.textMuted }} />
            <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              LOADING CHECKOUT
            </h1>
            <p className="text-lg" style={{ color: colorUsage.textMuted }}>
              Preparing your order details...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (cartItems.length === 0) {
    return (
      <PageLayout>
        <div className="px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-6" style={{ color: colorUsage.textMuted }} />
            <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              YOUR CART IS EMPTY
            </h1>
            <p className="text-lg mb-8" style={{ color: colorUsage.textMuted }}>
              Add some products to your cart before proceeding to checkout.
            </p>
            <Link href="/#configurator">
              <Button
                size="lg"
                className="font-bold text-lg px-8 py-4"
                style={{
                  backgroundColor: "#6EBA5E",
                  color: colorUsage.textOnDark,
                }}
              >
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="px-2 sm:px-4 py-8" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" className="font-semibold bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Left Side - Form */}
            <div className="lg:col-span-2">
              <Card className="p-3 sm:p-6 rounded-lg border mb-6" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                    PREORDER CHECKOUT
                  </h1>
                  <p className="mb-8" style={{ color: colorUsage.textMuted }}>
                    Complete your preorder reservation below. No payment required now.
                  </p>

                  {submitError && (
                    <div className="flex items-start gap-3 p-4 rounded-lg mb-6" style={{ backgroundColor: "#fef2f2" }}>
                      <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-800">{submitError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                      <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                        Please provide your contact details and delivery address
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            onBlur={handleEmailBlur}
                            required
                            className="mt-1"
                            disabled={!!user}
                          />
                          {emailStatus === "checking" && (
                            <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                              Checking email...
                            </p>
                          )}
                          {emailStatus === "exists" && !user && (
                            <p className="text-sm mt-1 text-blue-600">
                              <LogIn className="h-4 w-4 inline mr-1" />
                              Welcome back! Please sign in below.
                            </p>
                          )}
                          {emailStatus === "new" && !user && (
                            <p className="text-sm mt-1 text-green-600">
                              <UserPlus className="h-4 w-4 inline mr-1" />
                              New customer! We'll create your account.
                            </p>
                          )}
                          {user && (
                            <p className="text-sm mt-1 text-green-600">
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              Signed in as {user.email}
                            </p>
                          )}
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

                      {authError && (
                        <div
                          className="flex items-start gap-3 p-4 rounded-lg mb-4"
                          style={{ backgroundColor: "#fef2f2" }}
                        >
                          <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-800">{authError}</p>
                        </div>
                      )}

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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                        <div className="sm:col-span-2 lg:col-span-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            required
                            className="mt-1"
                            placeholder="Raleigh"
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

                      <div className="mb-4">
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                          required
                          className="mt-1 max-w-xs"
                          placeholder="12345"
                        />
                      </div>
                    </div>

                    {/* Authentication Section */}
                    {(authMode === "login" || authMode === "signup") && !user && (
                      <Card
                        className="p-6 rounded-lg border mb-6"
                        style={{ backgroundColor: colorUsage.backgroundPrimary }}
                      >
                        <CardContent className="pt-6">
                          {authMode === "login" && !isSignedIn && (
                            <div>
                              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <LogIn className="h-5 w-5" />
                                Sign In to Your Account
                              </h3>
                              <p className="mb-4" style={{ color: colorUsage.textMuted }}>
                                Enter your password to sign in and link this order to your account
                              </p>
                              <div className="max-w-md">
                                <Label htmlFor="password">Password *</Label>
                                <div className="flex gap-2 mt-1">
                                  <div className="relative flex-1">
                                    <Input
                                      id="password"
                                      type={showPassword ? "text" : "password"}
                                      value={formData.password}
                                      onChange={(e) => handleInputChange("password", e.target.value)}
                                      required
                                      className="pr-10"
                                      placeholder="Your existing password"
                                    />
                                    <button
                                      type="button"
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={handleSignIn}
                                    disabled={!formData.password || isSigningIn}
                                    className="font-semibold px-6"
                                    style={{
                                      backgroundColor:
                                        formData.password && !isSigningIn ? "#B9FF16" : colorUsage.textDisabled,
                                      color: formData.password && !isSigningIn ? "#000000" : colorUsage.textOnDark,
                                    }}
                                  >
                                    {isSigningIn ? "Signing In..." : "Sign In"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {authMode === "login" && isSignedIn && (
                            <div>
                              <div
                                className="flex items-center gap-3 p-4 rounded-lg"
                                style={{ backgroundColor: "#f0f9ff" }}
                              >
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <div>
                                  <p className="font-semibold text-green-800">Successfully signed in!</p>
                                  <p className="text-sm text-green-700">This order will be linked to your account.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {authMode === "signup" && (
                            <div>
                              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                Create Your Account
                              </h3>
                              <p className="mb-4" style={{ color: colorUsage.textMuted }}>
                                We'll create an account for you to track your order and manage future purchases.
                              </p>
                              <div className="max-w-md">
                                <Label htmlFor="password">Create Password *</Label>
                                <div className="relative mt-1">
                                  <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => handleInputChange("password", e.target.value)}
                                    required
                                    className="pr-10"
                                    placeholder="At least 6 characters"
                                  />
                                  <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs mt-1" style={{ color: colorUsage.textMuted }}>
                                  Your account will be created automatically when you complete your order.
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Delivery Information */}
                    <div>
                      <h2 className="text-xl font-bold mb-4">Delivery Information</h2>

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

                      <div className="mt-6">
                        <Label htmlFor="additionalNotes">Additional Notes (optional)</Label>
                        <Textarea
                          id="additionalNotes"
                          value={formData.additionalNotes}
                          onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                          className="mt-1"
                          rows={3}
                          placeholder="Any other information we should know..."
                        />
                      </div>

                      <div className="flex items-start space-x-2 mt-6">
                        <Checkbox
                          id="terms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked)}
                        />
                        <Label htmlFor="terms" className="text-sm leading-relaxed">
                          I understand this is a preorder reservation and I will receive an invoice once the weight
                          threshold is reached. I agree to the terms and conditions.
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full font-bold text-lg py-4 mt-6 border-2"
                        disabled={!isFormValid || isSubmitting}
                        style={{
                          backgroundColor: buttonBackgroundColor,
                          color: "#1a1a1a",
                          borderColor: isFormValid && !isSubmitting ? "#B9FF16" : colorUsage.textDisabled,
                        }}
                      >
                        {isSubmitting ? "Processing..." : "Complete Preorder Reservation"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Order Summary */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => {
                        const itemTotal = item.quantity * item.pricePerUnit
                        const regularTotal = itemTotal * 1.5
                        const savings = regularTotal - itemTotal

                        return (
                          <div key={item.productId} className="border-b pb-4 last:border-b-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <span className="font-semibold">{item.name}</span>
                                <div className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                                  Quantity: {item.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold">${itemTotal.toFixed(2)}</span>
                                <div className="text-sm line-through" style={{ color: colorUsage.textDisabled }}>
                                  ${regularTotal.toFixed(2)}
                                </div>
                                <div className="text-sm text-green-600">Save ${savings.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold">${cartTotals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Total Savings</span>
                        <span className="font-semibold">${cartTotals.totalSavings.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold" style={{ color: colorUsage.textOnLight }}>
                          ${cartTotals.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm mb-4" style={{ color: colorUsage.textMuted }}>
                        To be invoiced when weight goal is reached
                      </p>
                    </div>

                    <div
                      className="relative overflow-hidden rounded-xl p-6 mt-4"
                      style={{
                        background: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)`,
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                        <TrendingUp className="w-full h-full" style={{ color: "#B9FF16" }} />
                      </div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: "#B9FF16" }}
                          >
                            <TrendingUp className="w-5 h-5" style={{ color: "#1a1a1a" }} />
                          </div>
                          <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: "#B9FF16" }}>
                            Your Impact
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black" style={{ color: "#ffffff", fontFamily: "Oswald" }}>
                              {cartTotals.totalWeight}
                            </span>
                            <span className="text-2xl font-bold" style={{ color: "#B9FF16" }}>
                              lbs
                            </span>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: "#a0a0a0" }}>
                          Bringing us closer to our goal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold mb-4">Preorder Information</h3>
                    <div className="space-y-4 text-sm" style={{ color: colorUsage.textMuted }}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5 text-orange-500 flex-shrink-0" />
                        <p>
                          This is a preorder reservation. No payment will be taken now. Once we reach our goal, we'll
                          email you an invoice for payment.
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
    </PageLayout>
  )
}
