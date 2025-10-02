"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, Dumbbell, AlertCircle, Edit, RefreshCw, Lock, ArrowLeft } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageLayout } from "@/components/page-layout"

interface Product {
  id: string
  name: string
  weight: number
  price: number
  regularPrice?: number
  description?: string
  available: boolean
  created_at: string
  updated_at: string
}

interface PlateOption {
  id: string
  name: string
  weight: number
  price: number
  quantity: number
  available: boolean
}

interface OrderData {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  street_address: string
  city: string
  state: string
  zip_code: string
  delivery_instructions?: string
  delivery_option: string
  additional_notes?: string
  order_items: Array<{ quantity: number; weight: number; price: number }>
  subtotal: number
  total_weight: number
  status: string
  invoiced_at?: string
  payment_link_url?: string
  payment_link_created_at?: string
  order_locked?: boolean
  order_locked_reason?: string
  payment_status?: string
  canModify: boolean
}

export default function ModifyOrderPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [plates, setPlates] = useState<PlateOption[]>([])
  const [productsSource, setProductsSource] = useState<"database" | "fallback">("database")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    deliveryInstructions: "",
    deliveryOption: "door",
    additionalNotes: "",
  })

  useEffect(() => {
    if (orderNumber) {
      fetchOrderData()
    }
  }, [orderNumber])

  const fetchCurrentProducts = async (): Promise<Product[]> => {
    console.log("🔄 Fetching current products from database...")
    setProductsLoading(true)

    try {
      // Force fresh data with timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/products?t=${timestamp}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      console.log("📡 Products API response status:", response.status)

      if (!response.ok) {
        console.error("❌ Products API failed with status:", response.status)
        const errorText = await response.text()
        console.error("❌ Error response body:", errorText)
        throw new Error(`API failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("📦 Raw products API response:", result)

      if (result.success && result.products && Array.isArray(result.products)) {
        const products = result.products as Product[]

        console.log("✅ Successfully fetched", products.length, "products from database")
        console.log(
          "💰 Database product prices:",
          products.map((p) => ({
            weight: p.weight,
            price: p.price,
            name: p.name,
          })),
        )

        setProductsSource("database")
        return products
      } else {
        console.error("❌ Unexpected API response structure:", result)
        throw new Error("Invalid API response structure")
      }
    } catch (error) {
      console.error("💥 Error fetching products from database:", error)
      console.warn("⚠️ Falling back to hardcoded products due to API failure")
      setProductsSource("fallback")
      return getFallbackProducts()
    } finally {
      setProductsLoading(false)
    }
  }

  const getFallbackProducts = (): Product[] => {
    console.log("⚠️ Using fallback hardcoded products - THIS SHOULD NOT HAPPEN IN PRODUCTION")
    return [
      {
        id: "fallback-1",
        name: "10 lb Bumper Plates",
        weight: 10,
        price: 45,
        available: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "fallback-2",
        name: "15 lb Bumper Plates",
        weight: 15,
        price: 55,
        available: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "fallback-3",
        name: "25 lb Bumper Plates",
        weight: 25,
        price: 75,
        available: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "fallback-4",
        name: "35 lb Bumper Plates",
        weight: 35,
        price: 95,
        available: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "fallback-5",
        name: "45 lb Bumper Plates",
        weight: 45,
        price: 90, // Updated to match your database price
        available: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "fallback-6",
        name: "55 lb Bumper Plates",
        weight: 55,
        price: 135,
        available: true,
        created_at: "",
        updated_at: "",
      },
    ]
  }

  const fetchOrderData = async () => {
    try {
      console.log("🔍 Fetching order data for:", orderNumber)

      // Fetch order data first to check if it can be modified
      const orderResponse = await fetch(`/api/get-order/${orderNumber}`)
      const orderResult = await orderResponse.json()

      console.log("📋 Order data:", orderResult)

      if (orderResult.success && orderResult.order) {
        const order = orderResult.order
        setOrderData(order)

        console.log("🔒 Order modification check:", {
          canModify: order.canModify,
          orderLocked: order.order_locked,
          paymentLinkUrl: !!order.payment_link_url,
          status: order.status,
          paymentStatus: order.payment_status,
        })

        // If order cannot be modified, don't fetch products
        if (!order.canModify) {
          console.log("❌ Order cannot be modified, skipping product fetch")
          setLoading(false)
          return
        }

        // Only fetch products if order can be modified
        const currentProducts = await fetchCurrentProducts()

        // Populate form data
        setFormData({
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          streetAddress: order.street_address,
          city: order.city,
          state: order.state,
          zipCode: order.zip_code,
          deliveryInstructions: order.delivery_instructions || "",
          deliveryOption: order.delivery_option,
          additionalNotes: order.additional_notes || "",
        })

        // Create plates array from current products with validated pricing
        const updatedPlates: PlateOption[] = currentProducts.map((product: Product) => {
          const orderItem = order.order_items.find((item: any) => item.weight === product.weight)

          console.log(`🏷️ Mapping product ${product.name}: weight=${product.weight}, price=${product.price}`)

          return {
            id: product.id,
            name: product.name,
            weight: product.weight,
            price: product.price, // This should now be the correct database price
            quantity: orderItem ? orderItem.quantity : 0,
            available: product.available,
          }
        })

        // Sort by weight for consistent display
        updatedPlates.sort((a, b) => a.weight - b.weight)

        console.log("🏋️ Final plates configuration with database prices:")
        updatedPlates.forEach((p) => {
          console.log(`  - ${p.name}: $${p.price} (weight: ${p.weight}lb, qty: ${p.quantity})`)
        })

        setPlates(updatedPlates)
      } else {
        setError(orderResult.error || "Order not found")
      }
    } catch (error) {
      console.error("💥 Error loading data:", error)
      setError("Failed to load order data")
    } finally {
      setLoading(false)
    }
  }

  const refreshProducts = async () => {
    console.log("🔄 Manually refreshing products...")
    setProductsLoading(true)

    try {
      const currentProducts = await fetchCurrentProducts()

      // Update plates with new product data while preserving quantities
      const updatedPlates: PlateOption[] = currentProducts.map((product: Product) => {
        const existingPlate = plates.find((p) => p.weight === product.weight)

        console.log(`🔄 Refreshing ${product.name}: $${product.price}`)

        return {
          id: product.id,
          name: product.name,
          weight: product.weight,
          price: product.price, // Fresh price from database
          quantity: existingPlate?.quantity || 0,
          available: product.available,
        }
      })

      updatedPlates.sort((a, b) => a.weight - b.weight)
      setPlates(updatedPlates)
      console.log("✅ Products refreshed successfully from", productsSource)
    } catch (error) {
      console.error("❌ Failed to refresh products:", error)
    } finally {
      setProductsLoading(false)
    }
  }

  const updateQuantity = (index: number, change: number) => {
    setPlates((prev) =>
      prev.map((plate, i) => (i === index ? { ...plate, quantity: Math.max(0, plate.quantity + change) } : plate)),
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const orderItems = plates
        .filter((plate) => plate.quantity > 0)
        .map((plate) => ({
          quantity: plate.quantity,
          weight: plate.weight,
          price: plate.price,
        }))

      const subtotal = orderItems.reduce((sum, item) => {
        const itemTotal = item.quantity * item.price
        console.log(`💰 Item calculation: ${item.quantity} × ${item.price} = ${itemTotal}`)
        return sum + itemTotal
      }, 0)

      const totalWeight = orderItems.reduce((sum, item) => sum + item.quantity * item.weight * 2, 0)

      console.log("💾 Submitting order update with current database prices:")
      console.log("  - Order items:", orderItems)
      console.log("  - Subtotal calculation:", subtotal)
      console.log("  - Total weight:", totalWeight)

      const response = await fetch(`/api/update-order/${orderNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          deliveryInstructions: formData.deliveryInstructions,
          deliveryOption: formData.deliveryOption,
          additionalNotes: formData.additionalNotes,
          orderItems,
          subtotal,
          totalWeight,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to confirmation
        window.location.href = `/order-confirmation?order=${orderNumber}&updated=true`
      } else {
        console.error("❌ Order update failed:", result)
        setError(result.details || result.error || "Failed to update order")
      }
    } catch (error) {
      console.error("💥 Error submitting order update:", error)
      setError("There was an error updating your order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate totals with validation
  const subtotal = plates.reduce((sum, plate) => {
    const platePrice = typeof plate.price === "number" && !isNaN(plate.price) ? plate.price : 0
    const plateQuantity = typeof plate.quantity === "number" && !isNaN(plate.quantity) ? plate.quantity : 0
    const itemTotal = platePrice * plateQuantity
    return sum + itemTotal
  }, 0)

  const totalWeight = plates.reduce((sum, plate) => {
    const plateWeight = typeof plate.weight === "number" && !isNaN(plate.weight) ? plate.weight : 0
    const plateQuantity = typeof plate.quantity === "number" && !isNaN(plate.quantity) ? plate.quantity : 0
    return sum + plateWeight * plateQuantity * 2
  }, 0)

  const totalItems = plates.reduce((sum, plate) => {
    const plateQuantity = typeof plate.quantity === "number" && !isNaN(plate.quantity) ? plate.quantity : 0
    return sum + plateQuantity
  }, 0)

  // Calculate original order totals for comparison
  const originalSubtotal =
    typeof orderData?.subtotal === "number" && !isNaN(orderData.subtotal) ? orderData.subtotal : 0
  const originalWeight =
    typeof orderData?.total_weight === "number" && !isNaN(orderData.total_weight) ? orderData.total_weight : 0

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colorUsage.textOnLight }}
          ></div>
          <p>Loading your order and current products...</p>
        </div>
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="mb-6">{error}</p>
            <Link href="/my-account">
              <Button>View My Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!orderData.canModify) {
    const getReasonMessage = () => {
      if (orderData.payment_link_url) {
        return "A payment link has been generated for this order."
      }
      if (orderData.order_locked) {
        return orderData.order_locked_reason || "This order has been locked."
      }
      if (orderData.invoiced_at) {
        return "An invoice has been sent for this order."
      }
      if (orderData.payment_status === "paid") {
        return "This order has been paid."
      }
      if (orderData.status !== "pending") {
        return `Order status is ${orderData.status}.`
      }
      return "This order can no longer be modified."
    }

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Order Cannot Be Modified</h1>
            <div className="mb-6 space-y-2">
              <p className="text-gray-700">{getReasonMessage()}</p>
              {orderData.payment_link_url && (
                <p className="text-sm text-gray-600">
                  Please complete your payment or contact us if you need to make changes.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Link href={`/order-confirmation?order=${orderNumber}`}>
                <Button className="w-full">View Order Details</Button>
              </Link>
              {orderData.payment_link_url && (
                <a href={orderData.payment_link_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    Complete Payment
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageLayout>
      <div className="px-2 sm:px-4 py-8" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Left Side - Modification Form */}
            <div className="lg:col-span-2">
              {/* Plate Selection */}
              <Card className="p-6 rounded-lg border mb-6" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Edit className="h-6 w-6" style={{ color: colorUsage.textOnLight }} />
                    <h1 className="text-3xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                      MODIFY YOUR ORDER
                    </h1>
                  </div>
                  <p className="mb-8" style={{ color: colorUsage.textMuted }}>
                    Order #{orderData.order_number} • Status: {orderData.status}
                  </p>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold">Update Your Plate Selection</h2>
                    <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                      Adjust quantities below to update your order
                    </p>
                  </div>

                  {plates.length === 0 ? (
                    <div className="text-center py-8" style={{ color: colorUsage.textMuted }}>
                      <p>Loading current products...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className="hidden md:grid md:grid-cols-4 gap-4 font-semibold text-sm border-b pb-2"
                        style={{ color: colorUsage.textMuted }}
                      >
                        <span>PRODUCT</span>
                        <span>PRICE</span>
                        <span>QUANTITY</span>
                        <span>SUBTOTAL</span>
                      </div>
                      {plates.map((plate, index) => {
                        const platePrice = typeof plate.price === "number" && !isNaN(plate.price) ? plate.price : 0
                        const plateQuantity =
                          typeof plate.quantity === "number" && !isNaN(plate.quantity) ? plate.quantity : 0
                        const itemSubtotal = platePrice * plateQuantity

                        return (
                          <div key={plate.id} className="grid grid-cols-4 gap-4 items-center py-2">
                            <div>
                              <span className="font-semibold">{plate.name}</span>
                              <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                                {plate.weight} lbs (pair)
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold" style={{ color: colorUsage.textOnLight }}>
                                ${platePrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, -1)}
                                disabled={plateQuantity === 0 || !plate.available}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{plateQuantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, 1)}
                                disabled={!plate.available}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="font-semibold">${itemSubtotal.toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact & Delivery Information */}
              <Card className="p-6 rounded-lg border mb-6" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4">Update Contact & Delivery Information</h2>
                  <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                    Update your contact details and delivery address
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
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

                    <div>
                      <Label htmlFor="streetAddress">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        type="text"
                        value={formData.streetAddress}
                        onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
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
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange("zipCode", e.target.value)}
                        required
                        className="mt-1 w-32"
                      />
                    </div>

                    <div>
                      <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
                      <Textarea
                        id="deliveryInstructions"
                        value={formData.deliveryInstructions}
                        onChange={(e) => handleInputChange("deliveryInstructions", e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Can the product be left at your address?</Label>
                      <RadioGroup
                        value={formData.deliveryOption}
                        onValueChange={(value) => handleInputChange("deliveryOption", value)}
                        className="mt-2"
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
                    </div>

                    <div>
                      <Label htmlFor="additionalNotes">Additional Notes</Label>
                      <Textarea
                        id="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
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
                      className="w-full font-bold text-lg py-4 mt-6 border-2"
                      disabled={isSubmitting || totalItems === 0 || isNaN(subtotal)}
                      style={{
                        backgroundColor:
                          !isSubmitting && totalItems > 0 && !isNaN(subtotal)
                            ? "#B9FF16"
                            : colorUsage.textDisabled,
                        color: "#1a1a1a",
                        borderColor:
                          !isSubmitting && totalItems > 0 && !isNaN(subtotal)
                            ? "#B9FF16"
                            : colorUsage.textDisabled,
                      }}
                    >
                      {isSubmitting ? "Saving Changes..." : "Save Order Changes"}
                    </Button>
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

                    {/* Selected Items */}
                    <div className="space-y-4 mb-6">
                      {plates
                        .filter((plate) => plate.quantity > 0)
                        .map((plate) => {
                          const platePrice = typeof plate.price === "number" && !isNaN(plate.price) ? plate.price : 0
                          const plateQuantity =
                            typeof plate.quantity === "number" && !isNaN(plate.quantity) ? plate.quantity : 0
                          const itemTotal = platePrice * plateQuantity

                          return (
                            <div key={plate.id} className="border-b pb-4 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <span className="font-semibold">{plate.name}</span>
                                  <div className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                                    Quantity: {plateQuantity}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold">${itemTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      {totalItems === 0 && (
                        <div className="text-center py-8" style={{ color: colorUsage.textDisabled }}>
                          No plates selected
                        </div>
                      )}
                    </div>

                  {/* Totals */}
                  {totalItems > 0 && !isNaN(subtotal) && (
                    <>
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Total Weight</span>
                          <span className="font-semibold">{totalWeight} lbs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-semibold">${subtotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-bold">Total</span>
                          <span className="text-lg font-bold" style={{ color: colorUsage.textOnLight }}>
                            ${subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Order Comparison */}
                      <div className="mt-6 border-2 rounded-lg overflow-hidden" style={{ borderColor: "#B9FF16" }}>
                        <div
                          className="p-4"
                          style={{
                            backgroundColor: "#1a1a1a",
                          }}
                        >
                          <h4
                            className="text-base font-bold mb-1"
                            style={{ color: "#B9FF16", fontFamily: "Oswald, sans-serif", letterSpacing: "0.05em" }}
                          >
                            ORDER COMPARISON
                          </h4>
                          <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                            Original vs. Modified
                          </p>
                        </div>


                        <div className="p-6" style={{ backgroundColor: "#2d2d2d" }}>
                          <div className="space-y-4">
                            {/* Original Order */}
                            <div
                              className="flex justify-between items-center pb-3 border-b"
                              style={{ borderColor: "#404040" }}
                            >
                              <div>
                                <span className="text-xs font-semibold" style={{ color: "#B9FF16" }}>
                                  ORIGINAL ORDER
                                </span>
                              </div>
                              <span className="text-lg font-bold" style={{ color: "#ffffff" }}>
                                ${originalSubtotal.toFixed(2)}
                              </span>
                            </div>


                            {/* Updated Order */}
                            <div
                              className="flex justify-between items-center pb-3 border-b"
                              style={{ borderColor: "#404040" }}
                            >
                              <div>
                                <span className="text-xs font-semibold" style={{ color: "#B9FF16" }}>
                                  MODIFIED ORDER
                                </span>
                              </div>
                              <span className="text-lg font-bold" style={{ color: "#ffffff" }}>
                                ${subtotal.toFixed(2)}
                              </span>
                            </div>


                            {/* Difference */}
                            <div className="pt-2">
                              <div className="flex justify-between items-start">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: "#ffffff", fontFamily: "Oswald, sans-serif" }}
                                >
                                  DIFFERENCE
                                </span>
                                <div className="text-right">
                                  <div
                                    className="text-2xl font-black leading-none"
                                    style={{
                                      color:
                                        subtotal > originalSubtotal
                                          ? "#ef4444"
                                          : subtotal < originalSubtotal
                                            ? "#10b981"
                                            : "#B9FF16",
                                      fontFamily: "Oswald, sans-serif",
                                    }}
                                  >
                                    {subtotal > originalSubtotal && `+$${(subtotal - originalSubtotal).toFixed(2)}` }
                                    {subtotal < originalSubtotal && `-$${(originalSubtotal - subtotal).toFixed(2)}` }
                                    {subtotal === originalSubtotal && "$0.00"}
                                  </div>
                                  <div className="text-xs mt-1" style={{ color: colorUsage.textMuted }}>
                                    {totalWeight > originalWeight && `+${totalWeight - originalWeight} lbs` }
                                    {totalWeight < originalWeight && `-${originalWeight - totalWeight} lbs` }
                                    {totalWeight === originalWeight && "No weight change"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
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
