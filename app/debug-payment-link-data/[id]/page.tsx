"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

interface DebugData {
  timestamp: string
  orderId: string
  orderExists: {
    found: boolean
    error?: string
    data?: any
  }
  orderData: {
    found: boolean
    error?: string
    hasOrderItems: boolean
    orderItemsType: string
    customerEmail?: string
    customerName?: string
    status?: string
    paymentStatus?: string
  }
  orderWithCustomerJoin: {
    found: boolean
    error?: string
    hasCustomerData: boolean
    customerJoinData?: any
  }
  customerLookup: {
    attempted: boolean
    found: boolean
    error?: string
    data?: any
  }
  productsData?: any
  customersTableInfo: {
    available: boolean
    error?: any
    data?: any
  }
  environment: {
    hasStripeKey: boolean
    hasWebhookSecret: boolean
    baseUrl?: string
  }
}

export default function DebugPaymentLinkData({ params }: { params: { id: string } }) {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/debug-payment-link-data/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setDebugData(result.debug)
      } else {
        setError(result.error || "Failed to fetch debug data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [params.id])

  const StatusIcon = ({ success, error }: { success: boolean; error?: string }) => {
    if (error) return <XCircle className="h-4 w-4 text-red-500" />
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading debug data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Debug Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDebugData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!debugData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent>
            <p>No debug data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Link Debug Data</h1>
        <Button onClick={fetchDebugData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Order Existence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={debugData.orderExists.found} error={debugData.orderExists.error} />
              Order Existence Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={debugData.orderExists.found ? "default" : "destructive"}>
                  {debugData.orderExists.found ? "Found" : "Not Found"}
                </Badge>
                <span className="text-sm text-gray-600">Order ID: {debugData.orderId}</span>
              </div>
              {debugData.orderExists.error && (
                <div className="text-red-600 text-sm">Error: {debugData.orderExists.error}</div>
              )}
              {debugData.orderExists.data && (
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugData.orderExists.data, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={debugData.orderData.found} error={debugData.orderData.error} />
              Order Data Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Basic Info:</strong>
                <ul className="text-sm space-y-1 mt-1">
                  <li>
                    Found:{" "}
                    <Badge variant={debugData.orderData.found ? "default" : "destructive"}>
                      {debugData.orderData.found ? "Yes" : "No"}
                    </Badge>
                  </li>
                  <li>
                    Has Order Items:{" "}
                    <Badge variant={debugData.orderData.hasOrderItems ? "default" : "destructive"}>
                      {debugData.orderData.hasOrderItems ? "Yes" : "No"}
                    </Badge>
                  </li>
                  <li>
                    Order Items Type: <code>{debugData.orderData.orderItemsType}</code>
                  </li>
                </ul>
              </div>
              <div>
                <strong>Customer Info:</strong>
                <ul className="text-sm space-y-1 mt-1">
                  <li>Email: {debugData.orderData.customerEmail || "N/A"}</li>
                  <li>Name: {debugData.orderData.customerName || "N/A"}</li>
                  <li>Status: {debugData.orderData.status || "N/A"}</li>
                  <li>Payment Status: {debugData.orderData.paymentStatus || "N/A"}</li>
                </ul>
              </div>
            </div>
            {debugData.orderData.error && (
              <div className="text-red-600 text-sm mt-2">Error: {debugData.orderData.error}</div>
            )}
          </CardContent>
        </Card>

        {/* Customer Join Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon
                success={debugData.orderWithCustomerJoin.found}
                error={debugData.orderWithCustomerJoin.error}
              />
              Customer Join Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={debugData.orderWithCustomerJoin.found ? "default" : "destructive"}>
                  {debugData.orderWithCustomerJoin.found ? "Join Successful" : "Join Failed"}
                </Badge>
                <Badge variant={debugData.orderWithCustomerJoin.hasCustomerData ? "default" : "secondary"}>
                  {debugData.orderWithCustomerJoin.hasCustomerData ? "Has Customer Data" : "No Customer Data"}
                </Badge>
              </div>
              {debugData.orderWithCustomerJoin.error && (
                <div className="text-red-600 text-sm">Join Error: {debugData.orderWithCustomerJoin.error}</div>
              )}
              {debugData.orderWithCustomerJoin.customerJoinData && (
                <div>
                  <strong>Customer Join Data:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-1">
                    {JSON.stringify(debugData.orderWithCustomerJoin.customerJoinData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Lookup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={debugData.customerLookup.found} error={debugData.customerLookup.error} />
              Customer Lookup by Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={debugData.customerLookup.attempted ? "default" : "secondary"}>
                  {debugData.customerLookup.attempted ? "Attempted" : "Not Attempted"}
                </Badge>
                <Badge variant={debugData.customerLookup.found ? "default" : "destructive"}>
                  {debugData.customerLookup.found ? "Customer Found" : "Customer Not Found"}
                </Badge>
              </div>
              {debugData.customerLookup.error && (
                <div className="text-red-600 text-sm">Lookup Error: {debugData.customerLookup.error}</div>
              )}
              {debugData.customerLookup.data && (
                <div>
                  <strong>Customer Data:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-1">
                    {JSON.stringify(debugData.customerLookup.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Data */}
        {debugData.productsData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon success={!!debugData.productsData.data} error={debugData.productsData.error} />
                Products Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {debugData.productsData.weights && (
                  <div>
                    <strong>Requested Weights:</strong> {debugData.productsData.weights.join(", ")}
                  </div>
                )}
                {debugData.productsData.data && (
                  <div>
                    <strong>Found Products:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-1">
                      {JSON.stringify(debugData.productsData.data, null, 2)}
                    </pre>
                  </div>
                )}
                {debugData.productsData.error && (
                  <div className="text-red-600 text-sm">Products Error: {debugData.productsData.error}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={debugData.environment.hasStripeKey && debugData.environment.hasWebhookSecret} />
              Environment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Stripe Configuration:</strong>
                <ul className="text-sm space-y-1 mt-1">
                  <li>
                    Has Stripe Key:{" "}
                    <Badge variant={debugData.environment.hasStripeKey ? "default" : "destructive"}>
                      {debugData.environment.hasStripeKey ? "Yes" : "No"}
                    </Badge>
                  </li>
                  <li>
                    Has Webhook Secret:{" "}
                    <Badge variant={debugData.environment.hasWebhookSecret ? "default" : "destructive"}>
                      {debugData.environment.hasWebhookSecret ? "Yes" : "No"}
                    </Badge>
                  </li>
                </ul>
              </div>
              <div>
                <strong>URLs:</strong>
                <ul className="text-sm space-y-1 mt-1">
                  <li>Base URL: {debugData.environment.baseUrl || "Not Set"}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw Debug Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Debug Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
