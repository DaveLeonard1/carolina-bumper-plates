"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, Weight, Target } from "lucide-react"
import { colorUsage } from "@/lib/colors"

export default function AdminReportsPage() {
  // Mock data for demonstration
  const mockData = {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalWeight: 0,
    monthlyGrowth: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentActivity: [],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
          Reports & Analytics
        </h1>
        <p style={{ color: colorUsage.textMuted }}>Track business performance and key metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8" style={{ color: colorUsage.textMuted }} />
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">${mockData.totalRevenue.toLocaleString()}</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  +{mockData.monthlyGrowth}% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8" style={{ color: colorUsage.textMuted }} />
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Total Orders
                </p>
                <p className="text-2xl font-bold">{mockData.totalOrders}</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  All time orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8" style={{ color: colorUsage.textMuted }} />
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Total Customers
                </p>
                <p className="text-2xl font-bold">{mockData.totalCustomers}</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Registered users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Weight className="h-8 w-8" style={{ color: colorUsage.textMuted }} />
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Total Weight Sold
                </p>
                <p className="text-2xl font-bold">{mockData.totalWeight.toLocaleString()} lbs</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  All time weight
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-64 flex items-center justify-center"
              style={{ backgroundColor: colorUsage.backgroundLight }}
            >
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
                <p style={{ color: colorUsage.textMuted }}>Revenue chart will appear here</p>
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  Data visualization coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Order Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-64 flex items-center justify-center"
              style={{ backgroundColor: colorUsage.backgroundLight }}
            >
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
                <p style={{ color: colorUsage.textMuted }}>Order trends chart will appear here</p>
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  Track order volume over time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Reports */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
              <p style={{ color: colorUsage.textMuted }}>No product data yet</p>
              <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                Best selling products will appear here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                  Average Order Value
                </span>
                <span className="font-medium">${mockData.averageOrderValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                  Repeat Customers
                </span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                  Customer Lifetime Value
                </span>
                <span className="font-medium">$0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
              <p style={{ color: colorUsage.textMuted }}>No recent activity</p>
              <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                Recent orders and events will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
