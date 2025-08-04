"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dumbbell,
  Package,
  Edit,
  Eye,
  LogOut,
  User,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  CreditCard,
  CheckCircle,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { CancelOrderModal } from "@/components/cancel-order-modal"

interface Order {
  id: string
  order_number: string
  created_at: string
  status: string
  subtotal: number
  total_weight: number
  order_items: string | Array<{ quantity: number; weight: number; price: number }>
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
  invoiced_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  canModify: boolean
  canCancel: boolean
  order_locked?: boolean
  payment_link_url?: string
  payment_status?: string
  payment_link_created_at?: string
  paid_at?: string
  stripe_checkout_session_id?: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  delivery_instructions?: string
  delivery_option?: string
  created_at: string
  updated_at: string
  user_id?: string
  last_payment_at?: string
  total_paid_orders?: number
}

export default function MyAccountPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [editingProfile, setEditingProfile] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null)
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    delivery_instructions: "",
    delivery_option: "door",
  })

  // Redirect if not authenticated and fetch data when user is available
  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found, redirecting to login")
      router.push("/login")
      return
    }

    if (user) {
      console.log("User found, fetching account data:", user.email)
      fetchAccountData()
    }
  }, [user, loading, router])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchAccountData = async () => {
    if (!user) {
      console.log("No user available for fetching data")
      return
    }

    try {
      setError("")
      setLoadingData(true)
      console.log("Fetching account data for user:", user.id, user.email)

      // First, try to find customer by user_id
      const { data: customerByUserId, error: userIdError } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)

      console.log("Customer by user_id:", customerByUserId, userIdError)

      let customerData = null

      if (customerByUserId && customerByUserId.length > 0) {
        if (customerByUserId.length > 1) {
          console.warn("Multiple customers found for user_id, using first one")
        }
        customerData = customerByUserId[0]
        console.log("Using customer by user_id:", customerData)
      } else {
        // Try to find by email
        const { data: customerByEmail, error: emailError } = await supabase
          .from("customers")
          .select("*")
          .eq("email", user.email)

        console.log("Customer by email:", customerByEmail, emailError)

        if (customerByEmail && customerByEmail.length > 0) {
          if (customerByEmail.length > 1) {
            console.warn("Multiple customers found for email, using first one")
          }
          customerData = customerByEmail[0]

          // Link this customer to the auth user
          const { error: linkError } = await supabase
            .from("customers")
            .update({ user_id: user.id })
            .eq("id", customerData.id)

          if (linkError) {
            console.warn("Could not link customer to user:", linkError)
          } else {
            customerData.user_id = user.id // Update local data
            console.log("Linked customer to user:", customerData.id)
          }
        } else {
          console.log("No existing customer found, will create on first save")
        }
      }

      if (customerData) {
        setCustomer(customerData)
        setProfileData({
          name: customerData.name || "",
          phone: customerData.phone || "",
          street_address: customerData.street_address || "",
          city: customerData.city || "",
          state: customerData.state || "",
          zip_code: customerData.zip_code || "",
          delivery_instructions: customerData.delivery_instructions || "",
          delivery_option: customerData.delivery_option || "door",
        })
      } else {
        // Set default profile data from user metadata
        setProfileData({
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          phone: user.user_metadata?.phone || "",
          street_address: "",
          city: "",
          state: "",
          zip_code: "",
          delivery_instructions: "",
          delivery_option: "door",
        })
      }

      // Fetch orders - comprehensive approach to get all customer orders
      let ordersData = []

      // Strategy 1: Try by user_id first
      const { data: ordersByUserId, error: ordersUserIdError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (ordersByUserId && ordersByUserId.length > 0) {
        ordersData = [...ordersByUserId]
        console.log("Found orders by user_id:", ordersByUserId.length)
      }

      // Strategy 2: If we have customer data, also get orders by customer_id
      if (customerData) {
        const { data: ordersByCustomerId, error: ordersCustomerIdError } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customerData.id)
          .order("created_at", { ascending: false })

        if (ordersByCustomerId && ordersByCustomerId.length > 0) {
          console.log("Found orders by customer_id:", ordersByCustomerId.length)

          // Merge orders, avoiding duplicates
          const existingOrderIds = new Set(ordersData.map((order) => order.id))
          const newOrders = ordersByCustomerId.filter((order) => !existingOrderIds.has(order.id))
          ordersData = [...ordersData, ...newOrders]
          console.log("Added new orders from customer_id:", newOrders.length)

          // Update orders without user_id to include it for future lookups
          const ordersNeedingUserIdUpdate = ordersByCustomerId.filter((order) => !order.user_id)
          if (ordersNeedingUserIdUpdate.length > 0) {
            console.log("Updating", ordersNeedingUserIdUpdate.length, "orders with user_id")
            const { error: updateOrdersError } = await supabase
              .from("orders")
              .update({ user_id: user.id })
              .in(
                "id",
                ordersNeedingUserIdUpdate.map((order) => order.id),
              )

            if (updateOrdersError) {
              console.warn("Could not update orders user_id:", updateOrdersError)
            } else {
              console.log("Successfully updated orders with user_id")
            }
          }
        }
      }

      // Strategy 3: If still no orders, try by email as final fallback
      if (ordersData.length === 0) {
        const { data: ordersByEmail, error: ordersEmailError } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_email", user.email)
          .order("created_at", { ascending: false })

        if (ordersByEmail && !ordersEmailError && ordersByEmail.length > 0) {
          ordersData = ordersByEmail
          console.log("Found orders by email:", ordersData.length)

          // Update orders to include user_id and customer_id for future lookups
          const { error: updateOrdersError } = await supabase
            .from("orders")
            .update({
              user_id: user.id,
              customer_id: customerData?.id || null,
            })
            .eq("customer_email", user.email)

          if (updateOrdersError) {
            console.warn("Could not update orders user_id/customer_id:", updateOrdersError)
          } else {
            console.log("Successfully linked orders by email to user and customer")
          }
        }
      }

      // Sort all orders by creation date (most recent first)
      ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log("Final orders data before processing:", ordersData.length, "orders")

      // Process orders and add canModify and canCancel flags
      const processedOrders = ordersData.map((order) => {
        // Parse order_items if it's a string
        let orderItems = order.order_items
        if (typeof orderItems === "string") {
          try {
            orderItems = JSON.parse(orderItems)
          } catch (e) {
            console.warn("Could not parse order_items:", e)
            orderItems = []
          }
        }

        // Enhanced order status checks
        const isLocked = order.order_locked || !!order.payment_link_url
        const hasPaymentLink = !!order.payment_link_url
        const isPaid = order.payment_status === "paid"
        const isInvoiced = !!order.invoiced_at
        const isCancelled = !!order.cancelled_at
        const isPending = order.status === "pending"

        // Determine modification capabilities
        const canModify = !isLocked && !isInvoiced && !isPaid && !isCancelled && isPending
        const canCancel = !isLocked && !isPaid && !isCancelled && isPending
        const needsPayment = hasPaymentLink && !isPaid && !isCancelled

        return {
          ...order,
          order_items: orderItems,
          canModify,
          canCancel,
          isLocked,
          hasPaymentLink,
          needsPayment,
          isPaid,
          lockReason: isLocked ? (hasPaymentLink ? "Payment link generated" : "Order locked by admin") : null,
        }
      })

      setOrders(processedOrders)
      console.log("Final processed orders:", processedOrders.length)
    } catch (error) {
      console.error("Error fetching account data:", error)
      setError("Failed to load account data")
    } finally {
      setLoadingData(false)
    }
  }

  const verifyPaymentStatus = async (orderNumber: string) => {
    setVerifyingPayment(orderNumber)
    try {
      const response = await fetch(`/api/verify-payment-status/${orderNumber}`)
      const result = await response.json()

      if (result.success && result.payment_status === "paid") {
        setSuccessMessage(`Payment confirmed for order #${orderNumber}!`)
        // Refresh the orders data to show updated status
        await fetchAccountData()
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
    } finally {
      setVerifyingPayment(null)
    }
  }

  const handleProfileSave = async () => {
    if (!user) {
      setError("Authentication required")
      return
    }

    try {
      console.log("Updating customer profile:", profileData)
      console.log("User ID:", user.id)
      console.log("User Email:", user.email)
      console.log("Current Customer:", customer)

      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        street_address: profileData.street_address,
        city: profileData.city,
        state: profileData.state,
        zip_code: profileData.zip_code,
        delivery_instructions: profileData.delivery_instructions,
        delivery_option: profileData.delivery_option,
        updated_at: new Date().toISOString(),
        user_id: user.id, // Link to auth user
      }

      if (customer) {
        // Update existing customer record
        console.log("Updating existing customer:", customer.id)

        const { data: updatedCustomer, error: updateError } = await supabase
          .from("customers")
          .update(updateData)
          .eq("id", customer.id)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating existing customer:", updateError)
          setError(`Failed to update profile: ${updateError.message}`)
          return
        }

        console.log("Customer updated successfully:", updatedCustomer)
        setCustomer(updatedCustomer)
        setEditingProfile(false)
        setError("")
      } else {
        // Create new customer record
        console.log("Creating new customer record")

        const newCustomerData = {
          ...updateData,
          email: user.email,
          created_at: new Date().toISOString(),
        }

        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert(newCustomerData)
          .select()
          .single()

        if (createError) {
          console.error("Error creating new customer:", createError)

          // If creation fails due to email constraint, try to find and update existing
          if (createError.code === "23505" && createError.message.includes("email")) {
            console.log("Email already exists, trying to update existing customer")

            const { data: existingCustomer, error: findError } = await supabase
              .from("customers")
              .select("*")
              .eq("email", user.email)
              .single()

            if (findError || !existingCustomer) {
              setError("Failed to create or find customer profile")
              return
            }

            // Update the existing customer
            const { data: updatedExisting, error: updateExistingError } = await supabase
              .from("customers")
              .update(updateData)
              .eq("id", existingCustomer.id)
              .select()
              .single()

            if (updateExistingError) {
              console.error("Error updating existing customer by email:", updateExistingError)
              setError(`Failed to update profile: ${updateExistingError.message}`)
              return
            }

            console.log("Updated existing customer by email:", updatedExisting)
            setCustomer(updatedExisting)
            setEditingProfile(false)
            setError("")
            return
          }

          setError(`Failed to create profile: ${createError.message}`)
          return
        }

        console.log("Customer created successfully:", newCustomer)
        setCustomer(newCustomer)
        setEditingProfile(false)
        setError("")
      }
    } catch (error) {
      console.error("Error saving customer:", error)
      setError(`Failed to save profile: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleCancelOrder = (order: Order) => {
    setOrderToCancel(order)
    setCancelModalOpen(true)
  }

  const handleConfirmCancellation = async (reason: string) => {
    if (!orderToCancel) return

    try {
      setCancellingOrder(true)
      setError("")

      const response = await fetch(`/api/cancel-order/${orderToCancel.order_number}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to cancel order")
      }

      // Update the local orders state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderToCancel.id
            ? {
                ...order,
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reason,
                canModify: false,
                canCancel: false,
              }
            : order,
        ),
      )

      setSuccessMessage(`Order #${orderToCancel.order_number} has been cancelled successfully.`)
      setCancelModalOpen(false)
      setOrderToCancel(null)
    } catch (error) {
      console.error("Error cancelling order:", error)
      setError(error instanceof Error ? error.message : "Failed to cancel order")
    } finally {
      setCancellingOrder(false)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log("Signing out user")
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleRefresh = () => {
    fetchAccountData()
  }

  // Show loading while checking authentication
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
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null
  }

  const mostRecentOrder = orders[0]
  const otherOrders = orders.slice(1)

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
      {/* Header */}
      <header
        className="border-b px-4 py-4"
        style={{ backgroundColor: colorUsage.backgroundPrimary, borderColor: colorUsage.border }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8" style={{ color: colorUsage.textPrimary }} />
            <span className="text-xl font-bold">CAROLINA BUMPER PLATES</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: colorUsage.textMuted }}>
              {customer?.name || user.user_metadata?.full_name || user.email}
            </span>
            <Button variant="outline" onClick={handleSignOut} className="font-semibold">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              MY ACCOUNT
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              Manage your profile and track your preorders
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSuccessMessage("")}
                  variant="outline"
                  className="ml-auto h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
                <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <Button size="sm" onClick={handleRefresh} variant="outline" className="ml-auto">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Profile</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(!editingProfile)}
                      className="font-semibold"
                      disabled={loadingData}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {editingProfile ? "Cancel" : "Edit"}
                    </Button>
                  </div>

                  {loadingData ? (
                    <div className="text-center py-4">
                      <div
                        className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2"
                        style={{ borderColor: colorUsage.textOnLight }}
                      ></div>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        Loading profile...
                      </p>
                    </div>
                  ) : editingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="street_address">Address</Label>
                        <Input
                          id="street_address"
                          value={profileData.street_address}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, street_address: e.target.value }))}
                          className="mt-1"
                          placeholder="Street Address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={profileData.city}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                        />
                        <Input
                          value={profileData.state}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                        />
                      </div>
                      <Input
                        value={profileData.zip_code}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, zip_code: e.target.value }))}
                        placeholder="ZIP Code"
                        className="w-32"
                      />
                      <Button
                        onClick={handleProfileSave}
                        className="w-full font-semibold"
                        style={{
                          backgroundColor: colorUsage.buttonSecondary,
                          color: colorUsage.textOnDark,
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4" style={{ color: colorUsage.textOnLight }} />
                        <span>{customer?.name || user.user_metadata?.full_name || "Not set"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4" style={{ color: colorUsage.textOnLight }} />
                        <span>{user.email}</span>
                      </div>
                      {customer?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4" style={{ color: colorUsage.textOnLight }} />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer?.street_address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 mt-0.5" style={{ color: colorUsage.textOnLight }} />
                          <div className="text-sm">
                            <p>{customer.street_address}</p>
                            <p>
                              {customer.city}, {customer.state} {customer.zip_code}
                            </p>
                          </div>
                        </div>
                      )}
                      {customer?.last_payment_at && (
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4" style={{ color: colorUsage.textOnLight }} />
                          <div className="text-sm">
                            <p className="font-medium">Last Payment</p>
                            <p style={{ color: colorUsage.textMuted }}>
                              {new Date(customer.last_payment_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/#configurator">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        style={{ borderColor: colorUsage.textOnLight }}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        New Preorder
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Orders */}
            <div className="lg:col-span-2 space-y-6">
              {loadingData ? (
                <div className="text-center py-8">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                    style={{ borderColor: colorUsage.textOnLight }}
                  ></div>
                  <p>Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <Card className="p-8 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                  <CardContent className="pt-8 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
                    <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
                    <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                      You haven't placed any preorders yet. Start building your custom plate set!
                    </p>
                    <Link href="/#configurator">
                      <Button
                        className="font-semibold"
                        style={{ backgroundColor: colorUsage.buttonSecondary, color: colorUsage.textOnDark }}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Place Your First Order
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Most Recent Order - Detailed View */}
                  {mostRecentOrder && (
                    <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold">Most Recent Order</h3>
                            <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                              Order #{mostRecentOrder.order_number} •{" "}
                              {new Date(mostRecentOrder.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {/* Action Buttons - Enhanced for Paid Orders */}
                          <div className="flex gap-2">
                            <Link href={`/order-confirmation?order=${mostRecentOrder.order_number}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>

                            {mostRecentOrder.isPaid ? (
                              // Show paid confirmation
                              <Button size="sm" disabled className="bg-green-100 text-green-800 cursor-default">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Paid
                              </Button>
                            ) : mostRecentOrder.needsPayment ? (
                              // Show Pay for Order button for locked orders with payment links
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                                  onClick={() => window.open(mostRecentOrder.payment_link_url, "_blank")}
                                  disabled={verifyingPayment === mostRecentOrder.order_number}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  Pay for Order
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => verifyPaymentStatus(mostRecentOrder.order_number)}
                                  disabled={verifyingPayment === mostRecentOrder.order_number}
                                  title="Check if payment has been completed"
                                >
                                  {verifyingPayment === mostRecentOrder.order_number ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ) : mostRecentOrder.canModify ? (
                              <Link href={`/modify-order?order=${mostRecentOrder.order_number}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  style={{ borderColor: colorUsage.textOnLight, color: colorUsage.textOnLight }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                            ) : mostRecentOrder.isLocked ? (
                              <Button variant="outline" size="sm" disabled className="opacity-50">
                                <Lock className="h-4 w-4 mr-1" />
                                Locked
                              </Button>
                            ) : null}

                            {mostRecentOrder.canCancel && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelOrder(mostRecentOrder)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Order Details */}
                          <div>
                            <h4 className="font-semibold mb-3">Order Details</h4>
                            <div className="space-y-2 text-sm">
                              {Array.isArray(mostRecentOrder.order_items) &&
                                mostRecentOrder.order_items.map((item, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>
                                      {item.quantity}x {item.weight}lb Plates
                                    </span>
                                    <span className="font-semibold">${(item.quantity * item.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                                <span>Total</span>
                                <span>${mostRecentOrder.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs" style={{ color: colorUsage.textMuted }}>
                                <span>Weight</span>
                                <span>{mostRecentOrder.total_weight} lbs</span>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    mostRecentOrder.isPaid
                                      ? "bg-green-100 text-green-800"
                                      : mostRecentOrder.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : mostRecentOrder.status === "invoiced"
                                          ? "bg-blue-100 text-blue-800"
                                          : mostRecentOrder.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {mostRecentOrder.isPaid
                                    ? "Paid"
                                    : mostRecentOrder.status.charAt(0).toUpperCase() + mostRecentOrder.status.slice(1)}
                                </span>

                                {mostRecentOrder.isLocked && !mostRecentOrder.isPaid && (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    {mostRecentOrder.lockReason}
                                  </span>
                                )}

                                {mostRecentOrder.needsPayment && (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    Payment Required
                                  </span>
                                )}

                                {mostRecentOrder.isPaid && (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Payment Received
                                  </span>
                                )}
                              </div>

                              {mostRecentOrder.paid_at && (
                                <p className="text-xs mt-1" style={{ color: colorUsage.textMuted }}>
                                  Paid {new Date(mostRecentOrder.paid_at).toLocaleDateString()}
                                </p>
                              )}
                              {mostRecentOrder.invoiced_at && (
                                <p className="text-xs mt-1" style={{ color: colorUsage.textMuted }}>
                                  Invoiced {new Date(mostRecentOrder.invoiced_at).toLocaleDateString()}
                                </p>
                              )}
                              {mostRecentOrder.cancelled_at && (
                                <p className="text-xs mt-1" style={{ color: colorUsage.textMuted }}>
                                  Cancelled {new Date(mostRecentOrder.cancelled_at).toLocaleDateString()}
                                  {mostRecentOrder.cancellation_reason && (
                                    <span className="block">Reason: {mostRecentOrder.cancellation_reason}</span>
                                  )}
                                </p>
                              )}
                              {mostRecentOrder.payment_link_created_at && !mostRecentOrder.isPaid && (
                                <p className="text-xs mt-1" style={{ color: colorUsage.textMuted }}>
                                  Payment link created{" "}
                                  {new Date(mostRecentOrder.payment_link_created_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Delivery Info */}
                          <div>
                            <h4 className="font-semibold mb-3">Delivery Information</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="font-medium">Address:</p>
                                <p style={{ color: colorUsage.textMuted }}>
                                  {mostRecentOrder.street_address}
                                  <br />
                                  {mostRecentOrder.city}, {mostRecentOrder.state} {mostRecentOrder.zip_code}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">Contact:</p>
                                <p style={{ color: colorUsage.textMuted }}>
                                  {mostRecentOrder.customer_name}
                                  <br />
                                  {mostRecentOrder.customer_phone}
                                </p>
                              </div>
                              {mostRecentOrder.delivery_instructions && (
                                <div>
                                  <p className="font-medium">Instructions:</p>
                                  <p style={{ color: colorUsage.textMuted }}>{mostRecentOrder.delivery_instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {mostRecentOrder.isPaid ? (
                          <div className="mt-6 pt-4 border-t">
                            <div
                              className="flex items-center gap-3 p-4 rounded-lg"
                              style={{ backgroundColor: "#f0fdf4" }}
                            >
                              <CheckCircle className="h-6 w-6 text-green-600" />
                              <div className="flex-1">
                                <p className="font-semibold text-green-900">Payment Received</p>
                                <p className="text-sm text-green-700">
                                  Your payment has been successfully processed. We'll begin preparing your order for
                                  delivery.
                                </p>
                                {mostRecentOrder.paid_at && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Paid on {new Date(mostRecentOrder.paid_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : mostRecentOrder.needsPayment ? (
                          <div className="mt-6 pt-4 border-t">
                            <div
                              className="flex items-center gap-3 p-4 rounded-lg"
                              style={{ backgroundColor: "#f0fdf4" }}
                            >
                              <CreditCard className="h-6 w-6 text-green-600" />
                              <div className="flex-1">
                                <p className="font-semibold text-green-900">Payment Required</p>
                                <p className="text-sm text-green-700">
                                  A payment link has been generated for this order. Complete your payment to proceed.
                                </p>
                                {mostRecentOrder.lockReason && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Order locked: {mostRecentOrder.lockReason}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="lg"
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
                                  onClick={() => window.open(mostRecentOrder.payment_link_url, "_blank")}
                                  disabled={verifyingPayment === mostRecentOrder.order_number}
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pay for Order
                                </Button>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  onClick={() => verifyPaymentStatus(mostRecentOrder.order_number)}
                                  disabled={verifyingPayment === mostRecentOrder.order_number}
                                  title="Check payment status"
                                >
                                  {verifyingPayment === mostRecentOrder.order_number ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : mostRecentOrder.canModify ? (
                          <div className="mt-6 pt-4 border-t">
                            <div
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{ backgroundColor: "#f0f9ff" }}
                            >
                              <Edit className="h-5 w-5 text-blue-500" />
                              <div className="flex-1">
                                <p className="font-semibold text-blue-900">Order can be modified</p>
                                <p className="text-sm text-blue-700">Make changes before payment processing begins</p>
                              </div>
                              <Link href={`/modify-order?order=${mostRecentOrder.order_number}`}>
                                <Button size="sm" style={{ backgroundColor: "#3b82f6", color: "white" }}>
                                  Edit Order
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ) : mostRecentOrder.isLocked ? (
                          <div className="mt-6 pt-4 border-t">
                            <div
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{ backgroundColor: "#f9fafb" }}
                            >
                              <Lock className="h-5 w-5 text-gray-500" />
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">Order is locked</p>
                                <p className="text-sm text-gray-700">
                                  {mostRecentOrder.lockReason} - modifications are no longer allowed
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}

                  {/* Order History Summary - Only show if customer has more than one order */}
                  {orders.length > 1 && (
                    <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold">Order History</h3>
                            <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                              {otherOrders.length} previous order{otherOrders.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          
                        </div>

                        {/* Summary Stats */}
                        

                        {/* Condensed Order List */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm" style={{ color: colorUsage.textMuted }}>
                            PREVIOUS ORDERS
                          </h4>
                          {otherOrders.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow"
                              style={{ borderColor: colorUsage.border, backgroundColor: colorUsage.backgroundPrimary }}
                            >
                              {/* Left: Order Info */}
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="font-semibold text-sm">#{order.order_number}</p>
                                  <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                                    {new Date(order.created_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>

                                {/* Order Items Summary */}
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(order.order_items) &&
                                    order.order_items.slice(0, 3).map((item, index) => (
                                      <span
                                        key={index}
                                        className="text-xs px-2 py-1 rounded"
                                        style={{
                                          backgroundColor: colorUsage.backgroundLight,
                                          color: colorUsage.textMuted,
                                        }}
                                      >
                                        {item.quantity}×{item.weight}lb
                                      </span>
                                    ))}
                                  {Array.isArray(order.order_items) && order.order_items.length > 3 && (
                                    <span
                                      className="text-xs px-2 py-1 rounded"
                                      style={{
                                        backgroundColor: colorUsage.backgroundLight,
                                        color: colorUsage.textMuted,
                                      }}
                                    >
                                      +{order.order_items.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Center: Status & Weight */}
                              <div className="text-center">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    order.isPaid
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : order.status === "invoiced"
                                          ? "bg-blue-100 text-blue-800"
                                          : order.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {order.isPaid ? "Paid" : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                <p className="text-xs mt-1" style={{ color: colorUsage.textMuted }}>
                                  {order.total_weight} lbs
                                </p>
                              </div>

                              {/* Right: Amount & Actions */}
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="font-bold">${order.subtotal.toFixed(2)}</p>
                                  {order.paid_at && (
                                    <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                                      Paid{" "}
                                      {new Date(order.paid_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                  {order.invoiced_at && !order.paid_at && (
                                    <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                                      Invoiced{" "}
                                      {new Date(order.invoiced_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                  {order.cancelled_at && (
                                    <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                                      Cancelled{" "}
                                      {new Date(order.cancelled_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                  {order.payment_link_created_at && !order.paid_at && (
                                    <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                                      Payment link created
                                    </p>
                                  )}
                                </div>

                                <div className="flex gap-1">
                                  <Link href={`/order-confirmation?order=${order.order_number}`}>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </Link>

                                  {order.isPaid ? (
                                    <Button
                                      size="sm"
                                      disabled
                                      className="h-8 px-3 bg-green-100 text-green-800 text-xs font-semibold cursor-default"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Paid
                                    </Button>
                                  ) : order.needsPayment ? (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                                        onClick={() => window.open(order.payment_link_url, "_blank")}
                                        disabled={verifyingPayment === order.order_number}
                                      >
                                        <CreditCard className="h-3 w-3 mr-1" />
                                        Pay
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => verifyPaymentStatus(order.order_number)}
                                        disabled={verifyingPayment === order.order_number}
                                        title="Check payment status"
                                      >
                                        {verifyingPayment === order.order_number ? (
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <RefreshCw className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  ) : order.canModify ? (
                                    <Link href={`/modify-order?order=${order.order_number}`}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        style={{ borderColor: colorUsage.textOnLight, color: colorUsage.textOnLight }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </Link>
                                  ) : order.isLocked ? (
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 opacity-50" disabled>
                                      <Lock className="h-3 w-3" />
                                    </Button>
                                  ) : null}

                                  {order.canCancel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 border-red-300 hover:bg-red-50"
                                      onClick={() => handleCancelOrder(order)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* View All Orders Link */}
                        {otherOrders.length > 5 && (
                          <div className="mt-4 text-center">
                            <Button variant="outline" size="sm">
                              View All {orders.length} Orders
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false)
          setOrderToCancel(null)
        }}
        orderNumber={orderToCancel?.order_number || ""}
        orderTotal={orderToCancel?.subtotal || 0}
        onCancel={handleConfirmCancellation}
        isLoading={cancellingOrder}
      />
    </div>
  )
}
