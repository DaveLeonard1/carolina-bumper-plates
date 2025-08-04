"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, Package, Edit, Eye, LogOut, Plus, AlertCircle } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  order_number: string
  created_at: string
  status: string
  subtotal: number
  total_weight: number
  order_items: Array<{ quantity: number; weight: number; price: number }>
  invoiced_at?: string
  canModify: boolean
}

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [user, loading, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/customer/orders")
      const result = await response.json()

      if (result.success) {
        setOrders(result.orders)
      } else {
        setError(result.error || "Failed to load orders")
      }
    } catch (error) {
      setError("Failed to load orders")
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

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

  if (!user) {
    return null // Will redirect to login
  }

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
              Welcome, {user.user_metadata?.full_name || user.email}
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
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              MY DASHBOARD
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              Manage your preorders and account settings
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
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
                        <Plus className="h-4 w-4 mr-2" />
                        New Preorder
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full justify-start">
                        <Package className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            <div className="lg:col-span-3">
              <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Your Orders</h3>
                    <Link href="/#configurator">
                      <Button
                        className="font-semibold"
                        style={{ backgroundColor: colorUsage.buttonSecondary, color: colorUsage.textOnDark }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                      </Button>
                    </Link>
                  </div>

                  {loadingOrders ? (
                    <div className="text-center py-8">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                        style={{ borderColor: colorUsage.textOnLight }}
                      ></div>
                      <p>Loading your orders...</p>
                    </div>
                  ) : error ? (
                    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
                      <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
                      <h4 className="text-lg font-semibold mb-2">No Orders Yet</h4>
                      <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                        You haven't placed any preorders yet. Start building your custom plate set!
                      </p>
                      <Link href="/#configurator">
                        <Button
                          className="font-semibold"
                          style={{ backgroundColor: colorUsage.buttonSecondary, color: colorUsage.textOnDark }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Place Your First Order
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-4"
                          style={{ borderColor: colorUsage.border }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">Order #{order.order_number}</h4>
                              <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                                Placed on {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${order.subtotal}</p>
                              <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                                {order.total_weight} lbs
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "invoiced"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {order.invoiced_at && (
                                <span className="text-xs" style={{ color: colorUsage.textMuted }}>
                                  Invoiced {new Date(order.invoiced_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/order-confirmation?order=${order.order_number}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              {order.canModify && (
                                <Link href={`/modify-order?order=${order.order_number}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ borderColor: colorUsage.textOnLight, color: colorUsage.textOnLight }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Modify
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Order Items Summary */}
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: colorUsage.border }}>
                            <div className="flex flex-wrap gap-2">
                              {order.order_items.map((item, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 rounded"
                                  style={{ backgroundColor: colorUsage.backgroundLight, color: colorUsage.textMuted }}
                                >
                                  {item.quantity}x {item.weight}lb
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
