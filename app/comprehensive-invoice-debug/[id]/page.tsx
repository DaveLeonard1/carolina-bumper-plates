"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DebugResult {
  success: boolean
  logs: any[]
  debug_summary: {
    order_analysis: any
    product_sync_status: any
    stripe_integration: any
    recommendations: string[]
  }
  invoice?: any
  customer?: any
  error?: string
}

export default function ComprehensiveInvoiceDebug({ params }: { params: { id: string } }) {
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runComprehensiveDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/comprehensive-invoice-debug/${params.id}`, {
        method: "POST",
      })
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      console.error("Debug failed:", error)
      setDebugResult({
        success: false,
        error: "Debug request failed",
        logs: [],
        debug_summary: {
          order_analysis: null,
          product_sync_status: null,
          stripe_integration: null,
          recommendations: ["Debug request failed - check network connection"],
        },
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🔍 Comprehensive Invoice Debug</h1>
          <p className="mb-4">Running comprehensive analysis for Order {params.id}...</p>
          <div className="animate-pulse">
            <div className="space-y-2">
              <div>🔍 Phase 1: Order Analysis...</div>
              <div>🔄 Phase 2: Product Synchronization...</div>
              <div>💳 Phase 3: Stripe Integration Testing...</div>
              <div>📄 Phase 4: Invoice Creation...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🔍 Comprehensive Invoice Debug - Order {params.id}</h1>
        <Button onClick={runComprehensiveDebug} disabled={loading}>
          {loading ? "Running..." : "Run Comprehensive Debug"}
        </Button>
      </div>

      {!debugResult && (
        <Card>
          <CardHeader>
            <CardTitle>Multi-Faceted Invoice Debug Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This comprehensive debug system will analyze every aspect of the invoice creation process:
            </p>
            <ul className="space-y-2">
              <li>
                🔍 <strong>Phase 1:</strong> Complete order data analysis and parsing
              </li>
              <li>
                🔄 <strong>Phase 2:</strong> Product synchronization verification with Stripe
              </li>
              <li>
                💳 <strong>Phase 3:</strong> Stripe API integration testing
              </li>
              <li>
                📄 <strong>Phase 4:</strong> Step-by-step invoice creation with detailed logging
              </li>
            </ul>
            <Button onClick={runComprehensiveDebug} className="mt-4">
              Start Comprehensive Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {debugResult && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="order">Order Analysis</TabsTrigger>
            <TabsTrigger value="products">Product Sync</TabsTrigger>
            <TabsTrigger value="stripe">Stripe Integration</TabsTrigger>
            <TabsTrigger value="logs">Detailed Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {debugResult.success ? "✅" : "❌"} Debug Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <strong>Overall Status:</strong>{" "}
                      <Badge variant={debugResult.success ? "default" : "destructive"}>
                        {debugResult.success ? "SUCCESS" : "FAILED"}
                      </Badge>
                    </div>
                    <div>
                      <strong>Log Entries:</strong> {debugResult.logs.length}
                    </div>
                  </div>

                  {debugResult.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <strong>Error:</strong> {debugResult.error}
                    </div>
                  )}

                  <div>
                    <strong>Recommendations:</strong>
                    <div className="mt-2 space-y-1">
                      {debugResult.debug_summary.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span
                            className={
                              rec.includes("❌")
                                ? "text-red-600"
                                : rec.includes("⚠️")
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }
                          >
                            {rec}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {debugResult.invoice && (
                <Card>
                  <CardHeader>
                    <CardTitle>📄 Invoice Created Successfully</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Invoice ID:</strong> {debugResult.invoice.id}
                      </div>
                      <div>
                        <strong>Amount Due:</strong> ${(debugResult.invoice.amount_due / 100).toFixed(2)}
                      </div>
                      <div>
                        <strong>Status:</strong> {debugResult.invoice.status}
                      </div>
                      <div>
                        <strong>Line Items:</strong> {debugResult.invoice.lines?.data?.length || 0}
                      </div>
                    </div>
                    {debugResult.invoice.hosted_invoice_url && (
                      <div className="mt-4">
                        <a
                          href={debugResult.invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Invoice in Stripe →
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="order">
            <Card>
              <CardHeader>
                <CardTitle>📋 Order Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {debugResult.debug_summary.order_analysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Order Number:</strong> {debugResult.debug_summary.order_analysis.order.order_number}
                      </div>
                      <div>
                        <strong>Customer Email:</strong> {debugResult.debug_summary.order_analysis.order.customer_email}
                      </div>
                      <div>
                        <strong>Subtotal:</strong> ${debugResult.debug_summary.order_analysis.order.subtotal}
                      </div>
                      <div>
                        <strong>Status:</strong> {debugResult.debug_summary.order_analysis.order.status}
                      </div>
                    </div>

                    <div>
                      <strong>Order Items Parsing:</strong>
                      <div className="mt-2 p-3 bg-gray-50 rounded">
                        <div>
                          <strong>Method:</strong> {debugResult.debug_summary.order_analysis.parse_method}
                        </div>
                        <div>
                          <strong>Items Found:</strong> {debugResult.debug_summary.order_analysis.parsed_items.length}
                        </div>
                        {debugResult.debug_summary.order_analysis.parse_error && (
                          <div className="text-red-600">
                            <strong>Error:</strong> {debugResult.debug_summary.order_analysis.parse_error}
                          </div>
                        )}
                      </div>
                    </div>

                    {debugResult.debug_summary.order_analysis.parsed_items.length > 0 && (
                      <div>
                        <strong>Parsed Items:</strong>
                        <div className="mt-2 space-y-2">
                          {debugResult.debug_summary.order_analysis.parsed_items.map((item: any, index: number) => (
                            <div key={index} className="border p-2 rounded">
                              Weight: {item.weight}lb | Quantity: {item.quantity} | Price: ${item.price}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Order analysis data not available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>🔄 Product Synchronization Status</CardTitle>
              </CardHeader>
              <CardContent>
                {debugResult.debug_summary.product_sync_status ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <strong>Total Products:</strong>{" "}
                        {debugResult.debug_summary.product_sync_status.sync_status.total_products}
                      </div>
                      <div>
                        <strong>Fully Synced:</strong>{" "}
                        {debugResult.debug_summary.product_sync_status.sync_status.fully_synced}
                      </div>
                      <div>
                        <strong>Partially Synced:</strong>{" "}
                        {debugResult.debug_summary.product_sync_status.sync_status.partially_synced}
                      </div>
                      <div>
                        <strong>Not Synced:</strong>{" "}
                        {debugResult.debug_summary.product_sync_status.sync_status.not_synced}
                      </div>
                    </div>

                    {debugResult.debug_summary.product_sync_status.products.length > 0 && (
                      <div>
                        <strong>Product Details:</strong>
                        <div className="mt-2 space-y-2">
                          {debugResult.debug_summary.product_sync_status.products.map((product: any) => (
                            <div key={product.id} className="border p-3 rounded">
                              <div className="flex justify-between items-center">
                                <span>
                                  {product.title} ({product.weight}lb)
                                </span>
                                <Badge
                                  variant={
                                    product.sync_status === "fully_synced"
                                      ? "default"
                                      : product.sync_status === "partially_synced"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {product.sync_status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Price: ${product.selling_price} | Stripe Product:{" "}
                                {product.stripe_product_id ? "✅" : "❌"} | Stripe Price:{" "}
                                {product.stripe_price_id ? "✅" : "❌"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Product sync data not available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle>💳 Stripe Integration Testing</CardTitle>
              </CardHeader>
              <CardContent>
                {debugResult.debug_summary.stripe_integration ? (
                  <div className="space-y-4">
                    <div>
                      <strong>Customer Status:</strong>
                      <Badge
                        variant={
                          debugResult.debug_summary.stripe_integration.integration_status.customer_ready
                            ? "default"
                            : "destructive"
                        }
                      >
                        {debugResult.debug_summary.stripe_integration.integration_status.customer_ready
                          ? "Ready"
                          : "Failed"}
                      </Badge>
                    </div>

                    {debugResult.customer && (
                      <div className="p-3 bg-gray-50 rounded">
                        <div>
                          <strong>Customer ID:</strong> {debugResult.customer.id}
                        </div>
                        <div>
                          <strong>Email:</strong> {debugResult.customer.email}
                        </div>
                        <div>
                          <strong>Name:</strong> {debugResult.customer.name}
                        </div>
                      </div>
                    )}

                    <div>
                      <strong>Product Tests:</strong>
                      <div className="mt-2 space-y-2">
                        {debugResult.debug_summary.stripe_integration.stripe_product_tests.map(
                          (test: any, index: number) => (
                            <div key={index} className="border p-2 rounded">
                              <div className="flex justify-between items-center">
                                <span>{test.weight}lb Product</span>
                                <Badge
                                  variant={
                                    test.stripe_product_exists && test.stripe_price_exists ? "default" : "destructive"
                                  }
                                >
                                  {test.stripe_product_exists && test.stripe_price_exists ? "Valid" : "Invalid"}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Product: {test.stripe_product_exists ? "✅" : "❌"} | Price:{" "}
                                {test.stripe_price_exists ? "✅" : "❌"} |
                                {test.unit_amount && ` Amount: $${(test.unit_amount / 100).toFixed(2)}`}
                                {test.error && ` Error: ${test.error}`}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Stripe integration data not available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>📋 Detailed Debug Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugResult.logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border-l-4 ${
                        log.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong>{log.step.replace(/_/g, " ").toUpperCase()}</strong>
                          <span className="text-sm text-gray-500 ml-2">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? "SUCCESS" : "FAILED"}
                        </Badge>
                      </div>
                      {log.error && <div className="text-red-600 text-sm mt-1">Error: {log.error}</div>}
                      {log.data && (
                        <div className="text-sm mt-1">
                          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
