"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, TestTube, Trash2 } from "lucide-react"

interface IntegrationStatus {
  status: string
  health_score: string
  stripe_connection: boolean
  webhook_secret: boolean
  database_connection: boolean
  recent_webhooks: any[]
  recent_payments: any[]
  configuration_issues: string[]
  recommendations: string[]
}

interface TestResults {
  success: boolean
  test_results?: any
  test_payment_url?: string
  cleanup_order_id?: string
  error?: string
}

export default function VerifyStripeIntegration() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const checkIntegration = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/verify-stripe-integration")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to check integration:", error)
    } finally {
      setLoading(false)
    }
  }

  const testPaymentFlow = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/test-payment-flow", {
        method: "POST",
      })
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error("Failed to test payment flow:", error)
    } finally {
      setTesting(false)
    }
  }

  const cleanupTestOrder = async (orderId: string) => {
    try {
      await fetch(`/api/cleanup-test-order/${orderId}`, {
        method: "DELETE",
      })
      setTestResults(null)
      // Refresh integration status
      checkIntegration()
    } catch (error) {
      console.error("Failed to cleanup test order:", error)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      HEALTHY: "default",
      NEEDS_ATTENTION: "secondary",
      CRITICAL: "destructive",
      ERROR: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stripe Integration Verification</h1>
          <p className="text-muted-foreground">Verify that Stripe payment processing is properly configured</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkIntegration} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Check Integration
          </Button>
          <Button onClick={testPaymentFlow} disabled={testing} variant="outline">
            {testing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
            Test Payment Flow
          </Button>
        </div>
      </div>

      {status && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Integration Status</CardTitle>
              {getStatusBadge(status.status)}
            </div>
            <CardDescription>
              Health Score: {status.health_score} • Last checked: {new Date(status.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(status.stripe_connection)}
                <span>Stripe Connection</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.webhook_secret)}
                <span>Webhook Secret</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.database_connection)}
                <span>Database Connection</span>
              </div>
            </div>

            {status.configuration_issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Configuration Issues
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {status.configuration_issues.map((issue, index) => (
                    <li key={index} className="text-red-600">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {status.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {status.recommendations.map((rec, index) => (
                    <li key={index} className="text-blue-600">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Recent Webhooks ({status.recent_webhooks.length})</h4>
                {status.recent_webhooks.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    {status.recent_webhooks.map((webhook, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{webhook.order_id}</span>
                        <span className={webhook.success ? "text-green-600" : "text-red-600"}>
                          {webhook.success ? "✓" : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent webhook activity</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recent Payments ({status.recent_payments.length})</h4>
                {status.recent_payments.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    {status.recent_payments.map((payment, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{payment.order_number}</span>
                        <span className="text-green-600">{new Date(payment.paid_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent payments</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Payment Flow Test Results
            </CardTitle>
            <CardDescription>{testResults.success ? "Test completed successfully" : "Test failed"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.success && testResults.test_results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.test_results.order_created.success)}
                    <span>Test Order Created</span>
                    <code className="text-xs bg-muted px-1 rounded">
                      {testResults.test_results.order_created.order_number}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.test_results.stripe_session.success)}
                    <span>Stripe Session Created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.test_results.database_updates.success)}
                    <span>Database Updated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.test_results.webhook_endpoint.accessible)}
                    <span>Webhook Endpoint</span>
                  </div>
                </div>

                {testResults.test_payment_url && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Test Payment Link</h4>
                    <div className="flex gap-2">
                      <Button asChild size="sm">
                        <a href={testResults.test_payment_url} target="_blank" rel="noopener noreferrer">
                          Complete Test Payment
                        </a>
                      </Button>
                      {testResults.cleanup_order_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cleanupTestOrder(testResults.cleanup_order_id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cleanup Test Order
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-semibold">Next Steps</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {testResults.test_results.next_steps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <p>Test failed: {testResults.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
