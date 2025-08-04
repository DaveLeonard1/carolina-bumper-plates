"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertTriangle, Zap, Database, Network, RefreshCw, ArrowRight } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface WebhookInvestigation {
  success: boolean
  orderNumber: string
  order: any
  analysis: any
  workflowStatus: any
  issues: string[]
  recommendations: string[]
  rawData: any
}

export default function InvestigateWebhookTriggerPage() {
  const params = useParams()
  const [investigation, setInvestigation] = useState<WebhookInvestigation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchInvestigation = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/investigate-webhook-trigger/${params.orderNumber}`)
      const result = await response.json()

      if (result.success) {
        setInvestigation(result)
      } else {
        setError(result.error || "Investigation failed")
      }
    } catch (error) {
      console.error("Investigation error:", error)
      setError("Failed to investigate webhook trigger")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.orderNumber) {
      fetchInvestigation()
    }
  }, [params.orderNumber])

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge className={status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {status ? "✓" : "✗"} {label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Investigating webhook trigger for order {params.orderNumber}...</p>
        </div>
      </div>
    )
  }

  if (error || !investigation) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Investigation Failed</h3>
            <p style={{ color: colorUsage.textMuted }}>{error}</p>
            <Button onClick={fetchInvestigation} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Investigation
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
            Webhook Investigation
          </h1>
          <p style={{ color: colorUsage.textMuted }}>
            Order {investigation.orderNumber} - Payment Link to Zapier Webhook Analysis
          </p>
        </div>
        <Button onClick={fetchInvestigation} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Issues Alert */}
      {investigation.issues.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{investigation.issues.length} Issue(s) Found:</strong>
            <ul className="mt-2 space-y-1">
              {investigation.issues.map((issue, index) => (
                <li key={index} className="text-sm">
                  • {issue}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Webhook Workflow Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(investigation.workflowStatus.step1_orderExists)}
                <span className="font-medium">1. Order Exists</span>
              </div>
              {getStatusBadge(investigation.workflowStatus.step1_orderExists, "Order Found")}
            </div>

            <ArrowRight className="h-4 w-4 mx-auto text-gray-400" />

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(investigation.workflowStatus.step2_paymentLinkCreated)}
                <span className="font-medium">2. Payment Link Created</span>
              </div>
              {getStatusBadge(investigation.workflowStatus.step2_paymentLinkCreated, "Link Generated")}
            </div>

            <ArrowRight className="h-4 w-4 mx-auto text-gray-400" />

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(investigation.workflowStatus.step3_zapierConfigured)}
                <span className="font-medium">3. Zapier Configured</span>
              </div>
              {getStatusBadge(investigation.workflowStatus.step3_zapierConfigured, "Webhook Enabled")}
            </div>

            <ArrowRight className="h-4 w-4 mx-auto text-gray-400" />

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(investigation.workflowStatus.step4_webhookQueued)}
                <span className="font-medium">4. Webhook Queued</span>
              </div>
              {getStatusBadge(investigation.workflowStatus.step4_webhookQueued, "Added to Queue")}
            </div>

            <ArrowRight className="h-4 w-4 mx-auto text-gray-400" />

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(investigation.workflowStatus.step5_webhookDelivered)}
                <span className="font-medium">5. Webhook Delivered</span>
              </div>
              {getStatusBadge(investigation.workflowStatus.step5_webhookDelivered, "Delivery Attempted")}
            </div>

            <ArrowRight className="h-4 w-4 mx-auto text-gray-400" />

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(investigation.workflowStatus.step6_deliverySuccessful)}
                <span className="font-medium">6. Delivery Successful</span>
              </div>
              {getStatusBadge(investigation.workflowStatus.step6_deliverySuccessful, "Success Response")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Order Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Order Found:</span>
              <Badge
                className={
                  investigation.analysis.orderFound ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }
              >
                {investigation.analysis.orderFound ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Payment Link:</span>
              <Badge
                className={
                  investigation.analysis.hasPaymentLink ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }
              >
                {investigation.analysis.hasPaymentLink ? "Created" : "Missing"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Order Locked:</span>
              <Badge
                className={
                  investigation.analysis.orderLocked ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                }
              >
                {investigation.analysis.orderLocked ? "Yes" : "No"}
              </Badge>
            </div>
            {investigation.analysis.paymentLinkCreatedAt && (
              <div className="text-sm">
                <span style={{ color: colorUsage.textMuted }}>Link Created:</span>
                <br />
                {new Date(investigation.analysis.paymentLinkCreatedAt).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Webhook Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Zapier Enabled:</span>
              <Badge
                className={
                  investigation.analysis.zapierEnabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }
              >
                {investigation.analysis.zapierEnabled ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Queue Entries:</span>
              <Badge className="bg-blue-100 text-blue-800">{investigation.analysis.webhookQueueEntries}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Delivery Attempts:</span>
              <Badge className="bg-purple-100 text-purple-800">{investigation.analysis.webhookDeliveryAttempts}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Debug Sessions:</span>
              <Badge className="bg-gray-100 text-gray-800">{investigation.analysis.debugSessions.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {investigation.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {investigation.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Investigation Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Timeline Events ({investigation.rawData.timeline.length})</h4>
              {investigation.rawData.timeline.length > 0 ? (
                <div className="space-y-2">
                  {investigation.rawData.timeline.slice(0, 3).map((event: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{event.event_type}</span>
                        <span style={{ color: colorUsage.textMuted }}>
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs mt-1">{event.event_description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  No timeline events found
                </p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Webhook Queue ({investigation.rawData.webhookQueue.length})</h4>
              {investigation.rawData.webhookQueue.length > 0 ? (
                <div className="space-y-2">
                  {investigation.rawData.webhookQueue.slice(0, 3).map((entry: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Status: {entry.status}</span>
                        <span style={{ color: colorUsage.textMuted }}>
                          Attempts: {entry.attempts}/{entry.max_attempts}
                        </span>
                      </div>
                      {entry.error_message && <p className="text-xs mt-1 text-red-600">{entry.error_message}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  No webhook queue entries found
                </p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Webhook Logs ({investigation.rawData.webhookLogs.length})</h4>
              {investigation.rawData.webhookLogs.length > 0 ? (
                <div className="space-y-2">
                  {investigation.rawData.webhookLogs.slice(0, 3).map((log: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {log.success ? "✓ Success" : "✗ Failed"} - {log.response_status}
                        </span>
                        <span style={{ color: colorUsage.textMuted }}>{log.response_time_ms}ms</span>
                      </div>
                      {log.error_message && <p className="text-xs mt-1 text-red-600">{log.error_message}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  No webhook delivery logs found
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
