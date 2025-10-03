"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Package,
  Edit,
  Eye,
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
import { PageLayout } from "@/components/page-layout"
import { BatchProgress } from "@/components/batch-progress"

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
  lockReason?: string
  isLocked?: boolean
  hasPaymentLink?: boolean
  needsPayment?: boolean
  isPaid?: boolean
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

  const handleRefresh = () => {
    fetchAccountData()
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
            LOADING...
          </p>
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
    <PageLayout>
      <div className="bg-gray-50 overflow-x-hidden">
        {/* Page Header */}
        <div className="px-2 sm:px-4 py-8 sm:py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div>
              <h1
                className="text-4xl md:text-5xl font-black mb-4"
                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
              >
                MY ACCOUNT
              </h1>
              <p className="text-xl" style={{ color: "#1a1a1a" }}>
                Manage your profile and track your preorders
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-2 sm:px-4 py-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6">
                <div
                  className="flex items-start gap-3 p-4 rounded-lg border-2"
                  style={{ borderColor: colorUsage.accent, backgroundColor: "#f7fee7" }}
                >
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colorUsage.accent }} />
                  <div className="flex-1">
                    <p className="font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
                      {successMessage}
                    </p>
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
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border-2 border-red-200">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-red-800" style={{ fontFamily: "Oswald, sans-serif" }}>
                      {error}
                    </p>
                  </div>
                  <Button size="sm" onClick={handleRefresh} variant="outline" className="ml-auto bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    RETRY
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Left Column - Profile & Quick Actions */}
              <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                {/* Profile Card */}
                <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                  <div className="bg-black text-white p-4">
                    <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                      PROFILE
                    </h3>
                  </div>
                  <div className="p-6">
                    {loadingData ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading profile...</p>
                      </div>
                    ) : editingProfile ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="font-bold">
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                            className="mt-1 border-2 border-gray-300 focus:border-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="font-bold">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                            className="mt-1 border-2 border-gray-300 focus:border-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="street_address" className="font-bold">
                            Address
                          </Label>
                          <Input
                            id="street_address"
                            value={profileData.street_address}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, street_address: e.target.value }))}
                            className="mt-1 border-2 border-gray-300 focus:border-black"
                            placeholder="Street Address"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            value={profileData.city}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                            placeholder="City"
                            className="border-2 border-gray-300 focus:border-black"
                          />
                          <Input
                            value={profileData.state}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, state: e.target.value }))}
                            placeholder="State"
                            className="border-2 border-gray-300 focus:border-black"
                          />
                        </div>
                        <Input
                          value={profileData.zip_code}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, zip_code: e.target.value }))}
                          placeholder="ZIP Code"
                          className="w-32 border-2 border-gray-300 focus:border-black"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleProfileSave}
                            className="flex-1 font-black"
                            style={{
                              backgroundColor: colorUsage.accent,
                              color: "#000",
                              fontFamily: "Oswald, sans-serif",
                            }}
                          >
                            SAVE CHANGES
                          </Button>
                          <Button
                            onClick={() => setEditingProfile(false)}
                            variant="outline"
                            className="border-2 border-black font-bold"
                          >
                            CANCEL
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">
                          <User className="h-5 w-5" />
                          <span className="font-semibold">
                            {customer?.name || user.user_metadata?.full_name || "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">
                          <Mail className="h-5 w-5" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                        {customer?.phone && (
                          <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">
                            <Phone className="h-5 w-5" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        )}
                        {customer?.street_address && (
                          <div className="flex items-start gap-3 pb-3 border-b-2 border-gray-200">
                            <MapPin className="h-5 w-5 mt-0.5" />
                            <div className="text-sm">
                              <p>{customer.street_address}</p>
                              <p className="text-gray-600">
                                {customer.city}, {customer.state} {customer.zip_code}
                              </p>
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() => setEditingProfile(true)}
                          className="w-full font-bold border-2 border-black"
                          variant="outline"
                          disabled={loadingData}
                          style={{ fontFamily: "Oswald, sans-serif" }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          EDIT PROFILE
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                  <div className="bg-black text-white p-4">
                    <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                      QUICK ACTIONS
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <Link href="/#configurator" className="block">
                      <Button
                        className="w-full justify-start font-bold border-2 bg-transparent"
                        variant="outline"
                        style={{ borderColor: colorUsage.accent, color: "#000", fontFamily: "Oswald, sans-serif" }}
                      >
                        <Package className="h-5 w-5 mr-2" />
                        NEW PREORDER
                      </Button>
                    </Link>
                    <Link href="/contact" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-start font-bold border-2 border-black bg-transparent"
                        style={{ fontFamily: "Oswald, sans-serif" }}
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        CONTACT SUPPORT
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column - Orders */}
              <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                {loadingData ? (
                  <div className="text-center py-12 bg-white rounded-lg border-2 border-black">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
                      LOADING YOUR ORDERS...
                    </p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                    <div className="p-12 text-center">
                      <Package className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-2xl font-black mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                        NO ORDERS YET
                      </h3>
                      <p className="text-gray-600 mb-6">
                        You haven't placed any preorders yet. Start building your custom plate set!
                      </p>
                      <Link href="/#configurator">
                        <Button
                          className="font-black text-lg px-8 py-6"
                          style={{
                            backgroundColor: colorUsage.accent,
                            color: "#000",
                            fontFamily: "Oswald, sans-serif",
                          }}
                        >
                          <Package className="h-5 w-5 mr-2" />
                          PLACE YOUR FIRST ORDER
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Most Recent Order */}
                    {mostRecentOrder && (
                      <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                        <div className="bg-black text-white p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                                MOST RECENT ORDER
                              </h3>
                              <p className="text-sm text-gray-400">
                                Order #{mostRecentOrder.order_number} •{" "}
                                {new Date(mostRecentOrder.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Link href={`/order-confirmation?order=${mostRecentOrder.order_number}`}>
                                <Button size="sm" className="bg-white text-black hover:bg-gray-200 font-bold">
                                  <Eye className="h-4 w-4 mr-1" />
                                  VIEW
                                </Button>
                              </Link>
                              {mostRecentOrder.canModify && (
                                <Link href={`/modify-order?order=${mostRecentOrder.order_number}`}>
                                  <Button
                                    size="sm"
                                    className="font-bold"
                                    style={{ backgroundColor: colorUsage.accent, color: "#000" }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    EDIT
                                  </Button>
                                </Link>
                              )}
                              {mostRecentOrder.canCancel && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCancelOrder(mostRecentOrder)}
                                  className="bg-red-600 text-white hover:bg-red-700 font-bold"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  CANCEL
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                            {/* Order Details */}
                            <div>
                              <h4
                                className="text-sm font-black mb-3 uppercase"
                                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
                              >
                                Order Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                {Array.isArray(mostRecentOrder.order_items) &&
                                  mostRecentOrder.order_items.map((item, index) => (
                                    <div key={index} className="flex justify-between py-2 border-b border-gray-200">
                                      <span className="font-semibold">
                                        {item.quantity}x {item.weight}lb Plates
                                      </span>
                                      <span className="font-bold">${(item.quantity * item.price).toFixed(2)}</span>
                                    </div>
                                  ))}
                                <div className="flex justify-between pt-3 text-base font-black border-t-2 border-black">
                                  <span style={{ fontFamily: "Oswald, sans-serif" }}>TOTAL</span>
                                  <span style={{ fontFamily: "Oswald, sans-serif" }}>
                                    ${mostRecentOrder.subtotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>Weight</span>
                                  <span className="font-bold">{mostRecentOrder.total_weight} lbs</span>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-3 py-1 rounded font-bold text-xs uppercase ${
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
                                  style={{ fontFamily: "Oswald, sans-serif" }}
                                >
                                  {mostRecentOrder.isPaid ? "PAID" : mostRecentOrder.status.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Delivery Info */}
                            <div>
                              <h4
                                className="text-sm font-black mb-3 uppercase"
                                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
                              >
                                Delivery Information
                              </h4>
                              <div className="space-y-3 text-sm">
                                <div className="pb-3 border-b border-gray-200">
                                  <p className="font-bold text-xs uppercase text-gray-600 mb-1">Address</p>
                                  <p className="font-semibold">{mostRecentOrder.street_address}</p>
                                  <p className="text-gray-600">
                                    {mostRecentOrder.city}, {mostRecentOrder.state} {mostRecentOrder.zip_code}
                                  </p>
                                </div>
                                <div className="pb-3 border-b border-gray-200">
                                  <p className="font-bold text-xs uppercase text-gray-600 mb-1">Contact</p>
                                  <p className="font-semibold">{mostRecentOrder.customer_name}</p>
                                  <p className="text-gray-600">{mostRecentOrder.customer_phone}</p>
                                </div>
                                {mostRecentOrder.delivery_instructions && (
                                  <div>
                                    <p className="font-bold text-xs uppercase text-gray-600 mb-1">Instructions</p>
                                    <p className="text-gray-600">{mostRecentOrder.delivery_instructions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Alerts */}
                          {mostRecentOrder.isPaid ? (
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border-2 border-green-200">
                              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-black text-green-900" style={{ fontFamily: "Oswald, sans-serif" }}>
                                  PAYMENT RECEIVED
                                </p>
                                <p className="text-sm text-green-700">
                                  Your payment has been successfully processed. We'll begin preparing your order for
                                  delivery.
                                </p>
                              </div>
                            </div>
                          ) : mostRecentOrder.needsPayment ? (
                            <div
                              className="flex items-center gap-4 p-4 rounded-lg border-2"
                              style={{ backgroundColor: "#f7fee7", borderColor: colorUsage.accent }}
                            >
                              <CreditCard className="h-6 w-6 flex-shrink-0" style={{ color: colorUsage.accent }} />
                              <div className="flex-1">
                                <p className="font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                                  PAYMENT REQUIRED
                                </p>
                                <p className="text-sm text-gray-700">
                                  A payment link has been generated for this order. Complete your payment to proceed.
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="font-black px-6"
                                  style={{
                                    backgroundColor: colorUsage.accent,
                                    color: "#000",
                                    fontFamily: "Oswald, sans-serif",
                                  }}
                                  onClick={() => window.open(mostRecentOrder.payment_link_url, "_blank")}
                                  disabled={verifyingPayment === mostRecentOrder.order_number}
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  PAY NOW
                                </Button>
                              </div>
                            </div>
                          ) : mostRecentOrder.canModify ? (
                            <div
                              className="flex items-center gap-4 p-4 rounded-lg border-2"
                              style={{ backgroundColor: "#2d2d2d", borderColor: colorUsage.accent }}
                            >
                              <Edit className="h-6 w-6 flex-shrink-0" style={{ color: colorUsage.accent }} />
                              <div className="flex-1">
                                <p className="font-black text-white" style={{ fontFamily: "Oswald, sans-serif" }}>
                                  ORDER CAN BE MODIFIED
                                </p>
                                <p className="text-sm text-gray-300">Make changes before payment processing begins</p>
                              </div>
                              <Link href={`/modify-order?order=${mostRecentOrder.order_number}`}>
                                <Button
                                  className="font-black px-6"
                                  style={{
                                    backgroundColor: colorUsage.accent,
                                    color: "#000",
                                    fontFamily: "Oswald, sans-serif",
                                  }}
                                >
                                  EDIT ORDER
                                </Button>
                              </Link>
                            </div>
                          ) : mostRecentOrder.isLocked ? (
                            <div
                              className="flex items-center gap-4 p-4 rounded-lg border-2"
                              style={{ backgroundColor: "#2d2d2d", borderColor: "#6b7280" }}
                            >
                              <Lock className="h-6 w-6 text-gray-400 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-black text-white" style={{ fontFamily: "Oswald, sans-serif" }}>
                                  ORDER IS LOCKED
                                </p>
                                <p className="text-sm text-gray-400">
                                  {mostRecentOrder.lockReason} - modifications are no longer allowed
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* Order History */}
                    {orders.length > 1 && (
                      <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                        <div className="bg-black text-white p-4">
                          <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                            ORDER HISTORY
                          </h3>
                          <p className="text-sm text-gray-400">
                            {otherOrders.length} previous order{otherOrders.length !== 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="p-4 md:p-6 space-y-3">
                          {otherOrders.map((order) => (
                            <div
                              key={order.id}
                              className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-black transition-colors"
                            >
                              {/* Left: Order Number & Date */}
                              <div className="md:min-w-[140px]">
                                <p className="font-black text-lg" style={{ fontFamily: "Oswald, sans-serif" }}>
                                  #{order.order_number}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Middle: Amount, Weight & Status */}
                              <div className="flex-1 flex flex-wrap items-center gap-3 md:gap-6">
                                <div>
                                  <p className="font-black text-lg" style={{ fontFamily: "Oswald, sans-serif" }}>
                                    ${order.subtotal.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-600">{order.total_weight} lbs</p>
                                </div>

                                <span
                                  className={`px-4 py-2 rounded-full text-xs font-black uppercase ${
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
                                  style={{ fontFamily: "Oswald, sans-serif" }}
                                >
                                  {order.isPaid ? "PAID" : order.status}
                                </span>
                              </div>

                              {/* Right: Action Buttons */}
                              <div className="flex gap-2 flex-wrap w-full md:w-auto">
                                <Link href={`/order-confirmation?order=${order.order_number}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-2 border-black font-bold bg-transparent hover:bg-gray-50"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    VIEW
                                  </Button>
                                </Link>
                                {order.canModify && (
                                  <Link href={`/modify-order?order=${order.order_number}`}>
                                    <Button
                                      size="sm"
                                      className="font-bold"
                                      style={{ backgroundColor: colorUsage.accent, color: "#000" }}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      EDIT
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Batch Progress Section */}
        <BatchProgress />

      </div>

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
    </PageLayout>
  )
}
