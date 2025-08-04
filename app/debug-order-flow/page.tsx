"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function DebugOrderFlowPage() {
  const [debugData, setDebugData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [error, setError] = useState("")

  const fetchDebugData = async (testOrderNumber = "") => {
    setLoading(true)
    setError("")

    try {
      const url = testOrderNumber
        ? `/api/debug-order-flow?orderNumber=${encodeURIComponent(testOrderNumber)}`
        : "/api/debug-order-flow"

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch debug data")
      }

      setDebugData(data)
    } catch (err) {
      setError(err.message)
      console.error("Debug fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  const testOrderLookup = () => {
    if (!orderNumber.trim()) {
      setError("Please enter an order number")
      return
    }
    fetchDebugData(orderNumber.trim())
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Flow Debug Dashboard</h1>
          <p className="text-gray-600">Diagnose and troubleshoot order flow issues</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <p className="font-semibold">Error: {error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="orderNumber">Test Order Number</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Enter order number (e.g., CBP001234)"
                  />
                </div>
                <Button onClick={testOrderLookup} disabled={loading}>
                  Test Order Lookup
                </Button>
              </div>
              <Button onClick={() => fetchDebugData()} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh Debug Data
              </Button>
            </CardContent>
          </Card>

          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading debug information...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {debugData && (
            <>
              {/* Database Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {debugData.database?.connected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Database Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={debugData.database?.connected ? "text-green-600" : "text-red-600"}>
                        {debugData.database?.connected ? "Connected" : "Failed"}
                      </span>
                    </p>
                    {debugData.database?.connectionError && (
                      <p className="text-red-600">
                        <strong>Error:</strong> {debugData.database.connectionError}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Orders Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      <strong>Total Orders:</strong> {debugData.orders?.total || 0}
                    </p>

                    {debugData.orders?.countError && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Count Error: {debugData.orders.countError}</span>
                      </div>
                    )}

                    {debugData.orders?.recent && debugData.orders.recent.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recent Orders:</h4>
                        <div className="space-y-2">
                          {debugData.orders.recent.map((order, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded border text-sm">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <strong>Order:</strong> {order.order_number || "N/A"}
                                </div>
                                <div>
                                  <strong>Customer:</strong> {order.customer_name || "N/A"}
                                </div>
                                <div>
                                  <strong>Status:</strong> {order.status || "N/A"}
                                </div>
                                <div>
                                  <strong>Created:</strong>{" "}
                                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {debugData.orders?.recentError && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Recent Orders Error: {debugData.orders.recentError}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Test Results */}
              {debugData.orderTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {debugData.orderTest.found ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      Order Lookup Test: {debugData.orderTest.orderNumber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p>
                        <strong>Found:</strong>{" "}
                        <span className={debugData.orderTest.found ? "text-green-600" : "text-red-600"}>
                          {debugData.orderTest.found ? "Yes" : "No"}
                        </span>
                      </p>

                      {debugData.orderTest.found && debugData.orderTest.data && (
                        <div>
                          <h4 className="font-semibold mb-2">Order Details:</h4>
                          <div className="p-4 bg-gray-50 rounded border">
                            <pre className="text-sm overflow-auto">
                              {JSON.stringify(debugData.orderTest.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Debug Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Timestamp:</strong> {debugData.timestamp}
                    </p>
                    <p>
                      <strong>Environment:</strong> {process.env.NODE_ENV || "unknown"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
