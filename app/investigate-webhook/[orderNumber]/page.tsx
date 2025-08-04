"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw,
  ExternalLink,
  Bug,
  Activity,
  Settings,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface WebhookInvestigation {
  success: boolean
  orderNumber: string
  order: any
  webhookSettings: any
  queuedWebhooks: any[]
  webhookLogs: any[]
  timeline: any[]
  analysis: any
  issues: string[]
  recommendations: string[]
  manualTriggerResult: any
}

export default function InvestigateWebhookPage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string

  const [investigation, setInvestigation] = useState<WebhookInvestigation | null>(null)
  const [logs, setLogs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [triggering, setTriggering] = useState(false)

  const fetchInvestigation = async () => {
    try {
      const response = await fetch(`/api/investigate-webhook-failure/${orderNumber}`)
      const data = await response.json()
      setInvestigation(data)
    } catch (error) {
      console.error("Failed to fetch investigation:", error)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/webhook-debug-logs/${orderNumber}`)
      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    }
  }

  const testWebhookEndpoint = async () => {
    if (!investigation?.webhookSettings?.url) return

    setTesting(true)
    try {
      const response = await fetch("/api/test-webhook-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: investigation.webhookSettings.url }),
      })
      const result = await response.json()
      alert(result.success ? "Webhook endpoint is reachable!" : `Endpoint test failed: ${result.error}`)
    } catch (error) {
      alert("Failed to test endpoint")
    } finally {
      setTesting(false)
    }
  }

  const manualTrigger = async (eventType: string) => {
    setTriggering(true)
    try {
      const response = await fetch(`/api/manual-webhook-trigger/${orderNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: eventType }),
      })
      const result = await response.json()
      alert(result.success ? "Webhook triggered successfully!" : `Trigger failed: ${result.error}`)
      // Refresh data
      await fetchInvestigation()
      await fetchLogs()
    } catch (error) {
      alert("Failed to trigger webhook")
    } finally {
      setTriggering(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchInvestigation(), fetchLogs()])
      setLoading(false)
    }
    loadData()
  }, [orderNumber])

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

  if (!investigation?.success) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Investigation Failed</h2>
            <p className="text-gray-600">{investigation?.error || "Unknown error occurred"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ fontFamily: "Oswald, sans-serif" }}>
            <Bug className="h-8 w-8" />
            Webhook Investigation
          </h1>
          <p style={{ color: colorUsage.textMuted }}>Order: {orderNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a href={`/admin/orders/${investigation.order.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Order
            </a>
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              {investigation.analysis.webhookConfigured ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="text-sm font-medium">Webhook Config</div>
            <div className="text-xs text-gray-500">
              {investigation.analysis.webhookConfigured ? "Configured" : "Not Configured"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              {investigation.analysis.hasPaymentLink ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="text-sm font-medium">Payment Link</div>
            <div className="text-xs text-gray-500">
              {investigation.analysis.hasPaymentLink ? "Generated" : "Missing"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-sm font-medium">Queued Webhooks</div>
            <div className="text-xs text-gray-500">{investigation.analysis.queuedWebhooksCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-sm font-medium">Delivered</div>
            <div className="text-xs text-gray-500">{logs?.summary?.delivered_webhooks || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Issues & Recommendations */}
      {investigation.issues.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investigation.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">{issue}</p>
                    {investigation.recommendations[index] && (
                      <p className="text-sm text-red-600 mt-1">💡 {investigation.recommendations[index]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {investigation.webhookSettings.url && (
              <Button variant="outline" onClick={testWebhookEndpoint} disabled={testing}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {testing ? "Testing..." : "Test Endpoint"}
              </Button>
            )}

            {investigation.analysis.hasPaymentLink && investigation.analysis.webhookConfigured && (
              <Button variant="outline" onClick={() => manualTrigger("payment_link_created")} disabled={triggering}>
                <Zap className="h-4 w-4 mr-2" />
                {triggering ? "Triggering..." : "Trigger Payment Link Webhook"}
              </Button>
            )}

            {investigation.order.payment_status === "paid" && investigation.analysis.webhookConfigured && (
              <Button variant="outline" onClick={() => manualTrigger("order_completed")} disabled={triggering}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {triggering ? "Triggering..." : "Trigger Order Complete Webhook"}
              </Button>
            )}

            <Button variant="outline" asChild>
              <a href="/admin/settings">
                <Settings className="h-4 w-4 mr-2" />
                Webhook Settings
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs defaultValue="order" className="w-full">
        <TabsList>
          <TabsTrigger value="order">Order Details</TabsTrigger>
          <TabsTrigger value="config">Webhook Config</TabsTrigger>
          <TabsTrigger value="queue">Webhook Queue</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <p className="font-mono">{investigation.order.order_number}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={investigation.order.status === "paid" ? "default" : "secondary"}>
                    {investigation.order.status}
                  </Badge>
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <p>{investigation.order.customer_email}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p>${investigation.order.total_amount}</p>
                </div>
                <div>
                  <Label>Payment Link</Label>
                  {investigation.order.payment_link_url ? (
                    <a
                      href={investigation.order.payment_link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View Link <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-gray-500">Not generated</p>
                  )}
                </div>
                <div>
                  <Label>Payment Link Created</Label>
                  <p>{investigation.order.payment_link_created_at || "Not created"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enabled</Label>
                  <Badge variant={investigation.webhookSettings.enabled ? "default" : "secondary"}>
                    {investigation.webhookSettings.enabled ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <p className="font-mono text-sm break-all">{investigation.webhookSettings.url || "Not configured"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Timeout</Label>
                    <p>{investigation.webhookSettings.timeout}s</p>
                  </div>
                  <div>
                    <Label>Retry Attempts</Label>
                    <p>{investigation.webhookSettings.retryAttempts}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Queue ({investigation.queuedWebhooks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {investigation.queuedWebhooks.length === 0 ? (
                <p className="text-gray-500">No webhooks queued for this order</p>
              ) : (
                <div className="space-y-4">
                  {investigation.queuedWebhooks.map((webhook, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            webhook.status === "completed"
                              ? "default"
                              : webhook.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {webhook.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{webhook.event_type}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>Created:</strong> {new Date(webhook.created_at).toLocaleString()}
                        </p>
                        <p>
                          <strong>Attempts:</strong> {webhook.attempts}/{webhook.max_attempts}
                        </p>
                        {webhook.error_message && (
                          <p>
                            <strong>Error:</strong> {webhook.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>
                Delivery Logs ({logs?.summary?.delivered_webhooks + logs?.summary?.failed_webhooks || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!logs?.logs?.webhook_logs?.length ? (
                <p className="text-gray-500">No delivery attempts logged</p>
              ) : (
                <div className="space-y-4">
                  {logs.logs.webhook_logs.map((log, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                        <span className="text-sm text-gray-500">{log.event_type}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>Status:</strong> {log.response_status}
                        </p>
                        <p>
                          <strong>Response Time:</strong> {log.response_time_ms}ms
                        </p>
                        <p>
                          <strong>Retry Count:</strong> {log.retry_count}
                        </p>
                        {log.error_message && (
                          <p>
                            <strong>Error:</strong> {log.error_message}
                          </p>
                        )}
                        {log.response_body && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">Response Body</summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {log.response_body}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {!investigation.timeline?.length ? (
                <p className="text-gray-500">No timeline events found</p>
              ) : (
                <div className="space-y-4">
                  {investigation.timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{event.event_type.replace(/_/g, " ").toUpperCase()}</h4>
                          <span className="text-sm text-gray-500">{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
                        {event.event_data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm">Event Data</summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify(event.event_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-700">{children}</label>
}
