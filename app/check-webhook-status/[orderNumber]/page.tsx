"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, Clock, Search } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface WebhookStatusData {
  success: boolean
  orderNumber: string
  orderId: string
  analysis: {
    orderExists: boolean
    hasPaymentLink: boolean
    paymentLinkCreatedAt: string | null
    zapierConfigured: boolean
    webhookQueued: boolean
    debugSessionsFound: boolean
    timelineEventsFound: boolean
    deliveryAttemptsFound: boolean
  }
  diagnosis: string
  data: {
    order: any
    zapierConfig: any
    webhookQueue: any[]
    debugLogs: any[]
    timeline: any[]
    webhookLogs: any[]
  }
}

export default function CheckWebhookStatusPage({ params }: { params: { orderNumber: string } }) {
  const [data, setData] = useState<WebhookStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWebhookStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/check-webhook-status/${params.orderNumber}`)
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(result.error || "Failed to fetch webhook status")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhookStatus()
  }, [params.orderNumber])

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Checking webhook status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchWebhookStatus} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
            Webhook Status Check
          </h1>
          <p style={{ color: colorUsage.textMuted }}>Order: {params.orderNumber}</p>
        </div>
        <Button onClick={fetchWebhookStatus}>
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Diagnosis */}
      <Card
        className={`border-2 ${
          data.diagnosis.includes("successfully")
            ? "border-green-200 bg-green-50"
            : data.diagnosis.includes("failed") || data.diagnosis.includes("never")
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {data.diagnosis.includes("successfully") ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : data.diagnosis.includes("failed") || data.diagnosis.includes("never") ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{data.diagnosis}</p>
        </CardContent>
      </Card>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Order Exists</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Order found in database
                </p>
              </div>
              <StatusIcon status={data.analysis.orderExists} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Payment Link</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Payment link created
                </p>
              </div>
              <StatusIcon status={data.analysis.hasPaymentLink} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Zapier Config</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Webhook enabled & URL set
                </p>
              </div>
              <StatusIcon status={data.analysis.zapierConfigured} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Webhook Queued</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Added to delivery queue
                </p>
              </div>
              <StatusIcon status={data.analysis.webhookQueued} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Debug Sessions</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Debug logging found
                </p>
              </div>
              <StatusIcon status={data.analysis.debugSessionsFound} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Timeline Events</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Webhook events logged
                </p>
              </div>
              <StatusIcon status={data.analysis.timelineEventsFound} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delivery Attempts</p>
                <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                  Webhook delivery tried
                </p>
              </div>
              <StatusIcon status={data.analysis.deliveryAttemptsFound} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>ID:</strong> {data.data.order.id}
              </div>
              <div>
                <strong>Number:</strong> {data.data.order.order_number}
              </div>
              <div>
                <strong>Created:</strong> {new Date(data.data.order.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Payment Link:</strong> {data.data.order.payment_link_url ? "✅ Created" : "❌ Missing"}
              </div>
              {data.data.order.payment_link_created_at && (
                <div>
                  <strong>Link Created:</strong> {new Date(data.data.order.payment_link_created_at).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Zapier Config */}
        <Card>
          <CardHeader>
            <CardTitle>Zapier Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {data.data.zapierConfig ? (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Enabled:</strong> {data.data.zapierConfig.webhook_enabled ? "✅ Yes" : "❌ No"}
                </div>
                <div>
                  <strong>URL:</strong> {data.data.zapierConfig.webhook_url || "❌ Not set"}
                </div>
              </div>
            ) : (
              <p className="text-red-600">No Zapier configuration found</p>
            )}
          </CardContent>
        </Card>

        {/* Webhook Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Queue ({data.data.webhookQueue.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.data.webhookQueue.length > 0 ? (
              <div className="space-y-2">
                {data.data.webhookQueue.slice(0, 3).map((item, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <strong>Status:</strong> {item.status}
                    </div>
                    <div>
                      <strong>Attempts:</strong> {item.attempts}/{item.max_attempts}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: colorUsage.textMuted }}>No webhook queue entries found</p>
            )}
          </CardContent>
        </Card>

        {/* Webhook Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Logs ({data.data.webhookLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.data.webhookLogs.length > 0 ? (
              <div className="space-y-2">
                {data.data.webhookLogs.slice(0, 3).map((log, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <strong>Status:</strong> {log.status}
                    </div>
                    <div>
                      <strong>HTTP Status:</strong> {log.http_status_code}
                    </div>
                    <div>
                      <strong>Response Time:</strong> {log.response_time_ms}ms
                    </div>
                    {log.error_message && (
                      <div>
                        <strong>Error:</strong> {log.error_message}
                      </div>
                    )}
                    <div>
                      <strong>Attempted:</strong> {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: colorUsage.textMuted }}>No delivery logs found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
