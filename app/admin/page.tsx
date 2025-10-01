"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Users, Package, DollarSign, Clock, RefreshCw, Loader2, AlertTriangle } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { LiveActivityFeed } from "@/components/admin/live-activity-feed"

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useDashboardMetrics(30000) // Refresh every 30 seconds

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
              Admin Dashboard
            </h1>
            <p style={{ color: colorUsage.textMuted }}>Error loading dashboard data</p>
          </div>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metrics = data?.metrics || {
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    recentOrders: 0,
  }

  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <div className="px-4 py-8 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4"
                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
              >
                DASHBOARD
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-base md:text-lg">Manage orders, customers, and products</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#B9FF16] rounded-full animate-pulse"></div>
                  <span className="text-xs md:text-sm text-gray-600">Live data • Auto-refresh every 30s</span>
                </div>
              </div>
            </div>
            <Button
              onClick={refresh}
              className="font-bold border-2 border-black w-full md:w-auto"
              style={{ fontFamily: "Oswald, sans-serif", backgroundColor: colorUsage.accent, color: colorUsage.textOnAccent }}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              REFRESH
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL ORDERS
                  </h3>
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {metrics.totalOrders}
                </div>
                <p className="text-xs text-gray-600">{metrics.recentOrders} in last 7 days</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL CUSTOMERS
                  </h3>
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {metrics.totalCustomers}
                </div>
                <p className="text-xs text-gray-600">{metrics.recentCustomers} new this week</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    PENDING ORDERS
                  </h3>
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {metrics.pendingOrders}
                </div>
                <p className="text-xs text-gray-600">Awaiting payment</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL REVENUE
                  </h3>
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {formatCurrency(metrics.totalRevenue)}
                </div>
                <p className="text-xs text-gray-600">From {metrics.paidOrders} paid orders</p>
              </div>
            </div>
          </div>

      {/* Debug Info */}
      {data?.debug && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total Orders Found:</strong> {data.debug.ordersCount}
              </div>
              <div>
                <strong>Paid Orders:</strong> {data.debug.paidOrdersCount}
              </div>
              {data.debug.sampleOrder && (
                <div className="col-span-2">
                  <strong>Sample Order:</strong> {data.debug.sampleOrder.order_number} - Status:{" "}
                  {data.debug.sampleOrder.status} - Amount: $
                  {data.debug.sampleOrder.total_amount || data.debug.sampleOrder.subtotal || 0}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {data?.charts && <DashboardCharts data={data.charts} />}

          {/* Quick Actions */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  MANAGE ORDERS
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <ShoppingCart className="h-6 w-6 flex-shrink-0" style={{ color: "#B9FF16" }} />
                  <div>
                    <p className="text-sm text-gray-600">View, process, and manage customer orders</p>
                  </div>
                </div>
                <Link href="/admin/orders">
                  <Button
                    className="w-full font-black"
                    style={{ backgroundColor: "#B9FF16", color: "#000", fontFamily: "Oswald, sans-serif" }}
                  >
                    VIEW ORDERS
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  MANAGE CUSTOMERS
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Users className="h-6 w-6 flex-shrink-0" style={{ color: "#B9FF16" }} />
                  <div>
                    <p className="text-sm text-gray-600">View customer profiles and account information</p>
                  </div>
                </div>
                <Link href="/admin/customers">
                  <Button
                    className="w-full font-black"
                    style={{ backgroundColor: "#B9FF16", color: "#000", fontFamily: "Oswald, sans-serif" }}
                  >
                    VIEW CUSTOMERS
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  MANAGE PRODUCTS
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Package className="h-6 w-6 flex-shrink-0" style={{ color: "#B9FF16" }} />
                  <div>
                    <p className="text-sm text-gray-600">Configure bumper plate inventory and pricing</p>
                  </div>
                </div>
                <Link href="/admin/products">
                  <Button
                    className="w-full font-black"
                    style={{ backgroundColor: "#B9FF16", color: "#000", fontFamily: "Oswald, sans-serif" }}
                  >
                    VIEW PRODUCTS
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {data?.recentActivity && <LiveActivityFeed activities={data.recentActivity} lastUpdated={data.lastUpdated} />}
        </div>
      </div>
    </div>
  )
}
