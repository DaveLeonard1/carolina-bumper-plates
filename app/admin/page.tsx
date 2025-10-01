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
    recentCustomers: 0,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <p style={{ color: colorUsage.textMuted }}>Manage orders, customers, and products</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                Live data • Auto-refresh every 30s
              </span>
            </div>
          </div>
        </div>
        <Button onClick={refresh} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.recentOrders} in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.recentCustomers} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {metrics.paidOrders} paid orders
            </p>
          </CardContent>
        </Card>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-black">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center gap-2 font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
              <ShoppingCart className="h-5 w-5" />
              MANAGE ORDERS
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <p className="text-sm mb-4 text-gray-600">
              View, process, and manage customer orders
            </p>
            <Link href="/admin/orders">
              <Button 
                className="w-full font-bold border-2 border-black"
                style={{ 
                  fontFamily: "Oswald, sans-serif",
                  backgroundColor: colorUsage.accent,
                  color: colorUsage.textOnAccent
                }}
              >
                VIEW ORDERS
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center gap-2 font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
              <Users className="h-5 w-5" />
              MANAGE CUSTOMERS
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <p className="text-sm mb-4 text-gray-600">
              View customer profiles and account information
            </p>
            <Link href="/admin/customers">
              <Button 
                className="w-full font-bold border-2 border-black"
                style={{ 
                  fontFamily: "Oswald, sans-serif",
                  backgroundColor: colorUsage.accent,
                  color: colorUsage.textOnAccent
                }}
              >
                VIEW CUSTOMERS
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center gap-2 font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
              <Package className="h-5 w-5" />
              MANAGE PRODUCTS
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <p className="text-sm mb-4 text-gray-600">
              Configure bumper plate inventory and pricing
            </p>
            <Link href="/admin/products">
              <Button 
                className="w-full font-bold border-2 border-black"
                style={{ 
                  fontFamily: "Oswald, sans-serif",
                  backgroundColor: colorUsage.accent,
                  color: colorUsage.textOnAccent
                }}
              >
                VIEW PRODUCTS
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {data?.recentActivity && <LiveActivityFeed activities={data.recentActivity} lastUpdated={data.lastUpdated} />}
    </div>
  )
}
