"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Network,
  Database,
  Settings,
  Eye,
  RefreshCw,
  Play,
  Bug,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface DiagnosticResult {
  success: boolean
  sessionId: string
  orderId: string
  totalSteps: number
  failedSteps: number
  warningSteps: number
  completedSteps: number
  totalExecutionTime: number
  failurePoints: string[]
  recommendations: string[]
  configurationIssues: string[]
  networkIssues: string[]
  dataIssues: string[]
}

interface DebugSession {
  order_id: string
  debug_session_id: string
  total_steps: number
  failed_steps: number
  warning_steps: number
  completed_steps: number
  last_attempt: string
  failure_summary: string
  total_execution_time_ms: number
}

export default function WebhookDiagnosticsPage() {
  const [orderId, setOrderId] = useState("")
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null)
  const [debugHistory, setDebugHistory] = useState<DebugSession[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<DebugSession | null>(null)

  const runDiagnosis = async () => {
    if (!orderId.trim()) {
      alert("Please enter an Order ID")
      return
    }

    setDiagnosing(true)
    setDiagnosticResult(null)

    try {
      const response = await fetch(`/api/admin/diagnose-webhook-failure/${orderId}`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        setDiagnosticResult(result.diagnostic)
        await loadDebugHistory(orderId)
      } else {
        alert(`Diagnosis failed: ${result.error}`)
      }
    } catch (error) {
      console.error("Error running diagnosis:", error)
      alert("Failed to run webhook diagnosis")
    } finally {
      setDiagnosing(false)
    }
  }

  const loadDebugHistory = async (orderIdToLoad: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/diagnose-webhook-failure/${orderIdToLoad}`)
      const result = await response.json()

      if (result.success) {
        setDebugHistory(result.debugHistory)
      }
    } catch (error) {
      console.error("Error loading debug history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (success: boolean, hasWarnings: boolean) => {
    if (success && !hasWarnings) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (success && hasWarnings) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusBadge = (success: boolean, hasWarnings: boolean) => {
    if (success && !hasWarnings) return <Badge className="bg-green-100 text-green-800">Success</Badge>
    if (success && hasWarnings) return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
    return <Badge className="bg-red-100 text-red-800">Failed</Badge>
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "configuration":
        return <Settings className="h-4 w-4" />
      case "network":
        return <Network className="h-4 w-4" />
      case "data":
        return <Database className="h-4 w-4" />
      default:
        return <Bug className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
          Webhook Diagnostics
        </h1>
        <p style={{ color: colorUsage.textMuted }}>Diagnose and troubleshoot webhook delivery failures</p>
      </div>

      {/* Diagnosis Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Run Webhook Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                placeholder="Enter order ID to diagnose..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runDiagnosis()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={runDiagnosis} disabled={diagnosing}>
                {diagnosing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                {diagnosing ? "Diagnosing..." : "Run Diagnosis"}
              </Button>
            </div>
          </div>

          {diagnosticResult && (
            <Alert className={diagnosticResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnosticResult.success, diagnosticResult.warningSteps > 0)}
                <AlertDescription className={diagnosticResult.success ? "text-green-800" : "text-red-800"}>
                  <strong>Diagnosis Complete:</strong>{" "}
                  {diagnosticResult.success
                    ? "No critical issues found"
                    : `${diagnosticResult.failedSteps} critical issues detected`}
                  {diagnosticResult.warningSteps > 0 && ` (${diagnosticResult.warningSteps} warnings)`}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      {diagnosticResult && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues & Recommendations</TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{diagnosticResult.totalSteps}</div>
                  <div className="text-sm text-blue-700">Total Steps</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{diagnosticResult.completedSteps}</div>
                  <div className="text-sm text-green-700">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{diagnosticResult.warningSteps}</div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{diagnosticResult.failedSteps}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Execution Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Session ID:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{diagnosticResult.sessionId}</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{diagnosticResult.orderId}</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Execution Time:</span>
                    <span>{diagnosticResult.totalExecutionTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overall Status:</span>
                    {getStatusBadge(diagnosticResult.success, diagnosticResult.warningSteps > 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {/* Configuration Issues */}
            {diagnosticResult.configurationIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Settings className="h-5 w-5" />
                    Configuration Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosticResult.configurationIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Network Issues */}
            {diagnosticResult.networkIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Network className="h-5 w-5" />
                    Network Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosticResult.networkIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Data Issues */}
            {diagnosticResult.dataIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Database className="h-5 w-5" />
                    Data Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosticResult.dataIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {diagnosticResult.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <CheckCircle className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosticResult.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Failure Points</CardTitle>
              </CardHeader>
              <CardContent>
                {diagnosticResult.failurePoints.length === 0 ? (
                  <p className="text-center py-4" style={{ color: colorUsage.textMuted }}>
                    No failure points detected
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {diagnosticResult.failurePoints.map((point, index) => (
                      <li key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                        <code>{point}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Debug History */}
      {debugHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Debug History for Order {orderId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugHistory.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {session.debug_session_id.substring(0, 8)}...
                      </code>
                      {getStatusBadge(session.failed_steps === 0, session.warning_steps > 0)}
                    </div>
                    <div className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                      Steps: {session.completed_steps}/{session.total_steps} • Time: {session.total_execution_time_ms}ms
                      •{new Date(session.last_attempt).toLocaleString()}
                    </div>
                    {session.failure_summary && (
                      <div className="text-sm text-red-600 mt-1">{session.failure_summary}</div>
                    )}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Debug Session Details</DialogTitle>
                        <DialogDescription>Session {session.debug_session_id}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Total Steps</Label>
                            <div className="text-lg font-semibold">{session.total_steps}</div>
                          </div>
                          <div>
                            <Label>Failed Steps</Label>
                            <div className="text-lg font-semibold text-red-600">{session.failed_steps}</div>
                          </div>
                        </div>
                        {session.failure_summary && (
                          <div>
                            <Label>Failure Summary</Label>
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                              {session.failure_summary}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
