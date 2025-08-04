"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, CheckCircle, XCircle, RefreshCw, Play } from "lucide-react"

interface DiagnosticData {
  diagnostics: any
  summary: any
}

interface TestResults {
  testResults: any
  summary: any
}

export default function DebugServerErrorsPage() {
  const [loading, setLoading] = useState(true)
  const [testLoading, setTestLoading] = useState(false)
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null)
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [error, setError] = useState("")

  const loadDiagnostics = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/debug-server-errors")
      const result = await response.json()

      if (result.success) {
        setDiagnostics(result)
      } else {
        setError(result.error || "Failed to load diagnostics")
      }
    } catch (err) {
      console.error("Diagnostics error:", err)
      setError("Failed to load diagnostics")
    } finally {
      setLoading(false)
    }
  }

  const runTests = async () => {
    setTestLoading(true)

    try {
      const response = await fetch("/api/debug-server-errors", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setTestResults(result)
      } else {
        setError(result.error || "Failed to run tests")
      }
    } catch (err) {
      console.error("Test error:", err)
      setError("Failed to run tests")
    } finally {
      setTestLoading(false)
    }
  }

  useEffect(() => {
    loadDiagnostics()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
      case "configured":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case "missing_config":
        return <Badge className="bg-yellow-100 text-yellow-800">Missing Config</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "WARN":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading server diagnostics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Server Error Diagnostics</h1>
        <div className="flex gap-2">
          <Button onClick={loadDiagnostics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={runTests} disabled={testLoading}>
            {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run Tests
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status Overview */}
      {diagnostics && (
        <Card>
          <CardHeader>
            <CardTitle>System Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span>Database:</span>
                {getStatusBadge(diagnostics.summary.database_status)}
              </div>
              <div className="flex items-center justify-between">
                <span>Stripe:</span>
                {getStatusBadge(diagnostics.summary.stripe_status)}
              </div>
              <div className="flex items-center justify-between">
                <span>Supabase:</span>
                {getStatusBadge(diagnostics.summary.supabase_status)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span>Total Errors:</span>
                <Badge
                  className={
                    diagnostics.summary.total_errors > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                  }
                >
                  {diagnostics.summary.total_errors}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Warnings:</span>
                <Badge
                  className={
                    diagnostics.summary.total_warnings > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }
                >
                  {diagnostics.summary.total_warnings}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {diagnostics && diagnostics.diagnostics.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Errors ({diagnostics.diagnostics.errors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnostics.diagnostics.errors.map((error: any, index: number) => (
                <div key={index} className="border border-red-200 rounded p-3 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <Badge className="bg-red-100 text-red-800">{error.type}</Badge>
                        <span className="text-xs text-gray-500">{error.timestamp}</span>
                      </div>
                      <p className="text-sm text-red-800 mb-2">{error.message}</p>
                      {error.details && (
                        <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {diagnostics && diagnostics.diagnostics.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Warnings ({diagnostics.diagnostics.warnings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnostics.diagnostics.warnings.map((warning: any, index: number) => (
                <div key={index} className="border border-yellow-200 rounded p-3 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <Badge className="bg-yellow-100 text-yellow-800">{warning.type}</Badge>
                        <span className="text-xs text-gray-500">{warning.timestamp}</span>
                      </div>
                      <p className="text-sm text-yellow-800 mb-2">{warning.message}</p>
                      {warning.details && (
                        <pre className="text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(warning.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span>Passed:</span>
                <Badge className="bg-green-100 text-green-800">{testResults.summary.passed}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Failed:</span>
                <Badge className="bg-red-100 text-red-800">{testResults.summary.failed}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Warnings:</span>
                <Badge className="bg-yellow-100 text-yellow-800">{testResults.summary.warnings}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              {testResults.testResults.tests.map((test: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getTestStatusIcon(test.status)}
                    <span className="font-medium">{test.test}</span>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        test.status === "PASS"
                          ? "bg-green-100 text-green-800"
                          : test.status === "FAIL"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {test.status}
                    </Badge>
                    {test.error && <p className="text-xs text-red-600 mt-1">{test.error}</p>}
                    {test.issues && test.issues.length > 0 && (
                      <div className="text-xs text-yellow-600 mt-1">
                        {test.issues.map((issue: string, i: number) => (
                          <p key={i}>{issue}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              1. <strong>Copy Server Logs:</strong> Please copy and paste your actual server error logs for detailed
              analysis
            </p>
            <p>
              2. <strong>Review Errors:</strong> Address any errors shown in the diagnostics above
            </p>
            <p>
              3. <strong>Run Tests:</strong> Click "Run Tests" to perform deeper system validation
            </p>
            <p>
              4. <strong>Check Configuration:</strong> Ensure all environment variables are properly set
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
