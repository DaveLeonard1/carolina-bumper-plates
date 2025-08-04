"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database,
  TrendingUp,
  Users,
  ShoppingCart,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"
import { useSystemHealth } from "@/hooks/use-system-health"
import { useEffect } from "react"

export default function SystemHealthPage() {
  const { healthData, isLoading, error, lastChecked, runHealthCheck } = useSystemHealth()

  // Run initial health check on page load
  useEffect(() => {
    runHealthCheck()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
            System Health Monitor
          </h1>
          <p style={{ color: colorUsage.textMuted }}>Monitor order and payment status consistency across the system</p>
          {lastChecked && (
            <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
              Last checked: {lastChecked.toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={runHealthCheck} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Checking..." : "Run Health Check"}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Health Check Failed</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Overall Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
              <Badge className={getStatusBadge(healthData.status)}>{healthData.status.toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {healthData.metrics.database.responseTime}ms response
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Orders</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {healthData.metrics.orders.total} total, {healthData.metrics.orders.paid} paid
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">Revenue</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {healthData.metrics.revenue.formatted}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium">Customers</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {healthData.metrics.customers.total} registered
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Checks */}
      {healthData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Connectivity</CardTitle>
              {healthData.checks.databaseConnectivity ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${healthData.checks.databaseConnectivity ? "text-green-600" : "text-red-600"}`}
              >
                {healthData.checks.databaseConnectivity ? "Connected" : "Failed"}
              </div>
              <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                Response: {healthData.metrics.database.responseTime}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order System</CardTitle>
              {healthData.checks.orderSystemHealth ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${healthData.checks.orderSystemHealth ? "text-green-600" : "text-red-600"}`}
              >
                {healthData.checks.orderSystemHealth ? "Healthy" : "Issues"}
              </div>
              <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                {healthData.metrics.orders.recent24h} orders in 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer System</CardTitle>
              {healthData.checks.customerSystemHealth ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${healthData.checks.customerSystemHealth ? "text-green-600" : "text-red-600"}`}
              >
                {healthData.checks.customerSystemHealth ? "Operational" : "Error"}
              </div>
              <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                {healthData.metrics.customers.total} total customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              {healthData.checks.performanceAcceptable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${healthData.checks.performanceAcceptable ? "text-green-600" : "text-yellow-600"}`}
              >
                {healthData.checks.performanceAcceptable ? "Fast" : "Slow"}
              </div>
              <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                Total check: {healthData.responseTime}ms
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues */}
      {healthData && healthData.issues.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              System Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {healthData.issues.map((issue, index) => (
                <li key={index} className="flex items-center gap-2 text-yellow-800">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {!healthData && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading system health data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
