"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database,
  TrendingUp,
  Users,
  ShoppingCart,
  Webhook,
  Clock,
  Send,
  AlertCircle,
  Play,
  TestTube,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Save,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"
import { useUnifiedDashboard } from "@/hooks/use-unified-dashboard"
import { useEffect, useState } from "react"

export default function UnifiedAdminDashboard() {
  const { dashboardData, isLoading, error, lastChecked, fetchDashboardData } = useUnifiedDashboard()
  const [processing, setProcessing] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  // Webhook settings state
  const [webhookSettings, setWebhookSettings] = useState({
    webhook_enabled: false,
    webhook_url: "",
    webhook_timeout: 30,
    webhook_retry_attempts: 3,
    webhook_retry_delay: 5,
    include_customer_data: true,
    include_order_items: true,
    include_pricing_data: true,
    include_shipping_data: true,
    webhook_secret: "",
  })

  // Run initial data fetch on page load
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Update webhook settings when dashboard data loads
  useEffect(() => {
    if (dashboardData?.webhookDetails?.settings) {
      const settings = dashboardData.webhookDetails.settings
      setWebhookSettings({
        webhook_enabled: settings.webhook_enabled || false,
        webhook_url: settings.webhook_url || "",
        webhook_timeout: settings.webhook_timeout || 30,
        webhook_retry_attempts: settings.webhook_retry_attempts || 3,
        webhook_retry_delay: settings.webhook_retry_delay || 5,
        include_customer_data: settings.include_customer_data !== false,
        include_order_items: settings.include_order_items !== false,
        include_pricing_data: settings.include_pricing_data !== false,
        include_shipping_data: settings.include_shipping_data !== false,
        webhook_secret: "",
      })
    }
  }, [dashboardData])

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

  const getWebhookStatusBadge = (success: boolean, status: number) => {
    if (success) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>
    } else if (status >= 400 && status < 500) {
      return <Badge className="bg-yellow-100 text-yellow-800">Client Error</Badge>
    } else if (status >= 500) {
      return <Badge className="bg-red-100 text-red-800">Server Error</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    }
  }

  const getQueueStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const processWebhookQueue = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/process-webhook-queue", {
        method: "POST",
      })

      if (response.ok) {
        await fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error("Error processing queue:", error)
    } finally {
      setProcessing(false)
    }
  }

  const testZapierWebhook = async (eventType: string) => {
    if (!webhookSettings.webhook_url) {
      alert("Please enter a webhook URL first")
      return
    }

    setTestingWebhook(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/admin/test-zapier-webhook-unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookSettings.webhook_url,
          event_type: eventType,
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to test webhook",
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  const saveWebhookSettings = async () => {
    setSavingSettings(true)
    try {
      const response = await fetch("/api/admin/zapier-settings-unified", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookSettings.webhook_url || null,
          webhook_enabled: webhookSettings.webhook_enabled,
          webhook_timeout: webhookSettings.webhook_timeout,
          webhook_retry_attempts: webhookSettings.webhook_retry_attempts,
          webhook_retry_delay: webhookSettings.webhook_retry_delay,
          include_customer_data: webhookSettings.include_customer_data,
          include_order_items: webhookSettings.include_order_items,
          include_pricing_data: webhookSettings.include_pricing_data,
          include_shipping_data: webhookSettings.include_shipping_data,
          webhook_secret: webhookSettings.webhook_secret || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save webhook settings")
      }

      // Refresh dashboard data
      await fetchDashboardData()
      alert("Webhook settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSettingChange = (field: string, value: string | number | boolean) => {
    setWebhookSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
            System Dashboard
          </h1>
          <p style={{ color: colorUsage.textMuted }}>
            Monitor system health, webhook automation, and manage Zapier integration
          </p>
          {lastChecked && (
            <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
              Last updated: {lastChecked.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          {dashboardData?.metrics.webhooks && (
            <Button onClick={processWebhookQueue} disabled={processing} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              {processing ? "Processing..." : "Process Webhooks"}
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Dashboard Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Monitor</TabsTrigger>
          <TabsTrigger value="settings">Zapier Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        {/* System Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overall Status */}
          {dashboardData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                  <Badge className={getStatusBadge(dashboardData.status)}>{dashboardData.status.toUpperCase()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Database</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {dashboardData.metrics.database.responseTime}ms response
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Orders</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {dashboardData.metrics.orders.total} total, {dashboardData.metrics.orders.paid} paid
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="font-medium">Revenue</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {dashboardData.metrics.revenue.formatted}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">Customers</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {dashboardData.metrics.customers.total} registered
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Webhook className="h-8 w-8 text-indigo-500" />
                    <div>
                      <p className="font-medium">Webhooks</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {dashboardData.metrics.webhooks.successRate}% success rate
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Health Checks */}
          {dashboardData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Database</CardTitle>
                  {dashboardData.checks.databaseConnectivity ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${dashboardData.checks.databaseConnectivity ? "text-green-600" : "text-red-600"}`}
                  >
                    {dashboardData.checks.databaseConnectivity ? "Connected" : "Failed"}
                  </div>
                  <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                    {dashboardData.metrics.database.responseTime}ms response
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Order System</CardTitle>
                  {dashboardData.checks.orderSystemHealth ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${dashboardData.checks.orderSystemHealth ? "text-green-600" : "text-red-600"}`}
                  >
                    {dashboardData.checks.orderSystemHealth ? "Healthy" : "Issues"}
                  </div>
                  <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                    {dashboardData.metrics.orders.recent24h} orders in 24h
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Webhook System</CardTitle>
                  {dashboardData.checks.webhookSystemHealth && dashboardData.checks.webhookDeliveryHealth ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      dashboardData.checks.webhookSystemHealth && dashboardData.checks.webhookDeliveryHealth
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dashboardData.checks.webhookSystemHealth && dashboardData.checks.webhookDeliveryHealth
                      ? "Operational"
                      : "Issues"}
                  </div>
                  <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                    {dashboardData.metrics.webhooks.recent24h} webhooks in 24h
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  {dashboardData.checks.performanceAcceptable ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${dashboardData.checks.performanceAcceptable ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {dashboardData.checks.performanceAcceptable ? "Fast" : "Slow"}
                  </div>
                  <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                    Total check: {dashboardData.responseTime}ms
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Issues */}
          {dashboardData && dashboardData.issues.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  System Issues Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dashboardData.issues.map((issue, index) => (
                    <li key={index} className="flex items-center gap-2 text-yellow-800">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Webhook Monitor Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          {/* Webhook Statistics */}
          {dashboardData?.metrics.webhooks && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.metrics.webhooks.total}</div>
                  <div className="text-sm text-blue-700">Total Sent</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.metrics.webhooks.successful}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{dashboardData.metrics.webhooks.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{dashboardData.metrics.webhooks.pending}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardData.metrics.webhooks.avgResponseTime}ms
                  </div>
                  <div className="text-sm text-purple-700">Avg Response</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {dashboardData.metrics.webhooks.successRate}%
                  </div>
                  <div className="text-sm text-indigo-700">Success Rate</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Webhook Configuration Status */}
          {dashboardData?.webhookDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Configuration
                  <Badge
                    className={
                      dashboardData.metrics.webhooks.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {dashboardData.metrics.webhooks.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-medium mb-2">Configuration Status</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {dashboardData.metrics.webhooks.enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">Webhook Enabled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {dashboardData.metrics.webhooks.configured ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">Webhook URL Configured</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Webhook URL</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded" style={{ color: colorUsage.textMuted }}>
                      {dashboardData.webhookDetails.settings?.webhook_url
                        ? `${dashboardData.webhookDetails.settings.webhook_url.substring(0, 50)}...`
                        : "Not configured"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webhook Queue */}
          {dashboardData?.webhookDetails?.queueItems && dashboardData.webhookDetails.queueItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Webhook Queue ({dashboardData.webhookDetails.queueItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.webhookDetails.queueItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Order #{item.order_id}</span>
                          {getQueueStatusBadge(item.status)}
                        </div>
                        <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Attempts: {item.attempts}/{item.max_attempts}
                        </div>
                        {item.error_message && (
                          <div className="text-sm text-red-600 mt-1">Error: {item.error_message}</div>
                        )}
                      </div>
                      <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Zapier Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Zapier Email Automation Settings
                <Button onClick={saveWebhookSettings} disabled={savingSettings} size="sm" className="ml-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {savingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </CardTitle>
              <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                Configure automatic email notifications via Zapier webhooks
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5" style={{ color: colorUsage.textMuted }} />
                  <div>
                    <Label className="text-base font-medium">
                      {webhookSettings.webhook_enabled ? "Automation Enabled" : "Automation Disabled"}
                    </Label>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      {webhookSettings.webhook_enabled
                        ? "Automatically sending webhooks to Zapier"
                        : "Webhook automation is currently disabled"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={webhookSettings.webhook_enabled}
                  onCheckedChange={(checked) => handleSettingChange("webhook_enabled", checked)}
                />
              </div>

              {/* Webhook URL */}
              <div>
                <Label htmlFor="webhookUrl">Zapier Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookSettings.webhook_url}
                    onChange={(e) => handleSettingChange("webhook_url", e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => testZapierWebhook("payment_link_created")}
                      disabled={testingWebhook || !webhookSettings.webhook_url}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test Payment Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => testZapierWebhook("order_completed")}
                      disabled={testingWebhook || !webhookSettings.webhook_url}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test Order Complete
                    </Button>
                  </div>
                </div>
                <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                  Enter your Zapier webhook URL to enable automatic email notifications
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`p-4 border rounded-lg ${
                    testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                        {testResult.message}
                      </h4>
                      <div className="text-sm mt-1 space-y-1">
                        <p>Event Type: {testResult.event_type}</p>
                        <p>Status: {testResult.status}</p>
                        <p>Response Time: {testResult.response_time_ms}ms</p>
                        {testResult.error && <p className="text-red-700">Error: {testResult.error}</p>}
                        {testResult.response_body && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">Response Body</summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {testResult.response_body}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhookTimeout">Timeout (seconds)</Label>
                  <Input
                    id="webhookTimeout"
                    type="number"
                    min="5"
                    max="300"
                    value={webhookSettings.webhook_timeout}
                    onChange={(e) => handleSettingChange("webhook_timeout", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="retryAttempts">Retry Attempts</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    min="0"
                    max="10"
                    value={webhookSettings.webhook_retry_attempts}
                    onChange={(e) => handleSettingChange("webhook_retry_attempts", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Data Inclusion Options */}
              <div>
                <Label className="text-base font-medium">Data to Include in Webhooks</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeCustomerData"
                      checked={webhookSettings.include_customer_data}
                      onChange={(e) => handleSettingChange("include_customer_data", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includeCustomerData">Customer Information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeOrderItems"
                      checked={webhookSettings.include_order_items}
                      onChange={(e) => handleSettingChange("include_order_items", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includeOrderItems">Order Items</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includePricingData"
                      checked={webhookSettings.include_pricing_data}
                      onChange={(e) => handleSettingChange("include_pricing_data", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includePricingData">Pricing Details</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeShippingData"
                      checked={webhookSettings.include_shipping_data}
                      onChange={(e) => handleSettingChange("include_shipping_data", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includeShippingData">Shipping Information</Label>
                  </div>
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  placeholder="Enter secret for webhook signature verification"
                  value={webhookSettings.webhook_secret}
                  onChange={(e) => handleSettingChange("webhook_secret", e.target.value)}
                />
                <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                  If provided, webhooks will include an X-Webhook-Signature header for verification
                </p>
              </div>

              {/* Workflow Documentation */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800">Automated Email Workflow</h4>
                    <div className="text-sm text-blue-700 mt-1 space-y-2">
                      <p>
                        <strong>Payment Link Created:</strong> When an admin creates a payment link, Zapier receives
                        order details and customer email to send the payment link automatically.
                      </p>
                      <p>
                        <strong>Order Completed:</strong> When payment is received and order is marked as paid, Zapier
                        receives completion notification to send a thank you email with order details.
                      </p>
                      <p>
                        <strong>Reliable Delivery:</strong> Webhooks are queued and retried automatically if delivery
                        fails, ensuring no emails are missed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Recent Webhook Activity */}
          {dashboardData?.webhookDetails?.recentLogs && dashboardData.webhookDetails.recentLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Recent Webhook Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.webhookDetails.recentLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Order #{log.order_id}</span>
                          {getWebhookStatusBadge(log.success, log.response_status)}
                          <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                            {log.response_time_ms}ms
                          </span>
                        </div>
                        <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Status: {log.response_status} • Retries: {log.retry_count}
                        </div>
                        {log.error_message && (
                          <div className="text-sm text-red-600 mt-1">Error: {log.error_message}</div>
                        )}
                      </div>
                      <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {(!dashboardData?.webhookDetails?.recentLogs || dashboardData.webhookDetails.recentLogs.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Webhook Activity</h3>
                  <p className="text-gray-600">
                    No webhook deliveries have been logged yet. Configure your Zapier webhook URL to start receiving
                    notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {!dashboardData && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading dashboard data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
