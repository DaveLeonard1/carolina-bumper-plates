"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Send,
  Clock,
  Eye,
  Play,
  ExternalLink,
  Activity,
  Settings,
  List,
  BarChart3,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface WebhookInvestigation {
  success: boolean
  orderNumber: string
  status: "healthy" | "warning" | "error"
  order: {
    id: number
    order_number: string
    status: string
    customer_email: string
    total_amount: number
    payment_link_url: string | null
    payment_link_created_at: string | null
    created_at: string
    updated_at: string
  }
  webhookConfig: {
    enabled: boolean
    url: string
    configured: boolean
  }
  webhookActivity: {
    logs: any[]
    queueItems: any[]
    totalAttempts: number
    lastAttempt: string | null
  }
  analysis: {
    issues: string[]
    recommendations: string[]
    hasPaymentLink: boolean
    hasWebhookActivity: boolean
    webhookConfigured: boolean
  }
}

export default function InvestigateWebhookPage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string
  const [investigation, setInvestigation] = useState<WebhookInvestigation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [triggering, setTriggering] = useState<string | null>(null)

  useEffect(() => {
    fetchInvestigation()
  }, [orderNumber])

  const fetchInvestigation = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/investigate-webhook-failure/${orderNumber}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to investigate webhook")
      }

      setInvestigation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testWebhookEndpoint = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/test-webhook-endpoint", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        alert("Webhook endpoint test successful!")
      } else {
        alert(`Webhook endpoint test failed: ${data.message}`)
      }
    } catch (err) {
      alert("Failed to test webhook endpoint")
    } finally {
      setTesting(false)
    }
  }

  const triggerWebhook = async (webhookType: string) => {
    setTriggering(webhookType)
    try {
      const response = await fetch(`/api/manual-webhook-trigger/${orderNumber}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhookType }),
      })
      const data = await response.json()

      if (data.success) {
        alert(`${webhookType} webhook triggered successfully!`)
        await fetchInvestigation() // Refresh data
      } else {
        alert(`Failed to trigger webhook: ${data.message}`)
      }
    } catch (err) {
      alert("Failed to trigger webhook")
    } finally {
      setTriggering(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Investigating webhook for order {orderNumber}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Investigation Failed</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <Button onClick={fetchInvestigation} className="mt-4 bg-transparent" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Investigation
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!investigation) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">No investigation data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
            Webhook Investigation: {orderNumber}
          </h1>
          <div className="flex items-center gap-2">
            <span>Status:</span>
            {getStatusBadge(investigation.status)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInvestigation} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => window.open(`/admin/orders/${investigation.order.id}`, "_blank")} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Order
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testWebhookEndpoint} disabled={testing} variant="outline">
              <Send className="h-4 w-4 mr-2" />
              {testing ? "Testing..." : "Test Endpoint"}
            </Button>
            <Button
              onClick={() => triggerWebhook("payment_link")}
              disabled={triggering === "payment_link" || !investigation.analysis.hasPaymentLink}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              {triggering === "payment_link" ? "Triggering..." : "Trigger Payment Link Webhook"}
            </Button>
            <Button
              onClick={() => triggerWebhook("order_completed")}
              disabled={triggering === "order_completed" || investigation.order.status !== "paid"}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              {triggering === "order_completed" ? "Triggering..." : "Trigger Completion Webhook"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues and Recommendations */}
      {investigation.analysis.issues.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Problems:</h4>
                <ul className="space-y-1">
                  {investigation.analysis.issues.map((issue, index) => (
                    <li key={index} className="flex items-center gap-2 text-yellow-800">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {investigation.analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2 text-yellow-800">
                      <CheckCircle className="w-4 h-4" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Investigation */}
      <Tabs defaultValue="order" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="order" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Order Details
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Webhook Config
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Webhook Queue
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Delivery Logs
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="order" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="font-medium">Order Number</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {investigation.order.order_number}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {investigation.order.status}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Customer Email</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {investigation.order.customer_email}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    ${investigation.order.total_amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Payment Link</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {investigation.order.payment_link_url ? "Generated" : "Not generated"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Payment Link Created</p>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {investigation.order.payment_link_created_at
                      ? new Date(investigation.order.payment_link_created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {investigation.webhookConfig.enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Webhook Enabled: {investigation.webhookConfig.enabled ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {investigation.webhookConfig.url ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Webhook URL Configured: {investigation.webhookConfig.url ? "Yes" : "No"}</span>
                </div>
                {investigation.webhookConfig.url && (
                  <div>
                    <p className="font-medium mb-2">Webhook URL</p>
                    <p
                      className="text-sm font-mono bg-gray-100 p-2 rounded break-all"
                      style={{ color: colorUsage.textMuted }}
                    >
                      {investigation.webhookConfig.url}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Queue ({investigation.webhookActivity.queueItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {investigation.webhookActivity.queueItems.length === 0 ? (
                <p className="text-center py-8" style={{ color: colorUsage.textMuted }}>
                  No webhooks in queue for this order
                </p>
              ) : (
                <div className="space-y-2">
                  {investigation.webhookActivity.queueItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Queue Item #{item.id}</span>
                          {getQueueStatusBadge(item.status)}
                        </div>
                        <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Attempts: {item.attempts}/{item.max_attempts} • Next retry:{" "}
                          {item.next_retry_at ? new Date(item.next_retry_at).toLocaleString() : "N/A"}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Delivery Logs ({investigation.webhookActivity.logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {investigation.webhookActivity.logs.length === 0 ? (
                <p className="text-center py-8" style={{ color: colorUsage.textMuted }}>
                  No webhook delivery attempts found for this order
                </p>
              ) : (
                <div className="space-y-2">
                  {investigation.webhookActivity.logs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Delivery #{log.id}</span>
                          {getWebhookStatusBadge(log.success, log.response_status)}
                          <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                            {log.response_time_ms}ms
                          </span>
                        </div>
                        <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Status: {log.response_status} • Retries: {log.retry_count} • URL:{" "}
                          {log.webhook_url.substring(0, 50)}...
                        </div>
                        {log.error_message && (
                          <div className="text-sm text-red-600 mt-1">Error: {log.error_message}</div>
                        )}
                        {log.response_body && (
                          <div className="text-sm mt-1">
                            <details>
                              <summary className="cursor-pointer text-blue-600">View Response</summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                {log.response_body}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                      <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order & Webhook Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Order Created</p>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      {new Date(investigation.order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {investigation.order.payment_link_created_at && (
                  <div className="flex items-center gap-3 p-3 border-l-4 border-green-500 bg-green-50">
                    <Send className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Payment Link Generated</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {new Date(investigation.order.payment_link_created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {investigation.webhookActivity.queueItems.map((item: any) => (
                  <div
                    key={`queue-${item.id}`}
                    className="flex items-center gap-3 p-3 border-l-4 border-yellow-500 bg-yellow-50"
                  >
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Webhook Queued</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {new Date(item.created_at).toLocaleString()} • Status: {item.status}
                      </p>
                    </div>
                  </div>
                ))}

                {investigation.webhookActivity.logs.map((log: any) => (
                  <div
                    key={`log-${log.id}`}
                    className={`flex items-center gap-3 p-3 border-l-4 ${
                      log.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                    }`}
                  >
                    <Send className={`h-5 w-5 ${log.success ? "text-green-600" : "text-red-600"}`} />
                    <div>
                      <p className="font-medium">Webhook {log.success ? "Delivered" : "Failed"}</p>
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {new Date(log.created_at).toLocaleString()} • Status: {log.response_status} •{" "}
                        {log.response_time_ms}ms
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-3 p-3 border-l-4 border-gray-500 bg-gray-50">
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                      {new Date(investigation.order.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
