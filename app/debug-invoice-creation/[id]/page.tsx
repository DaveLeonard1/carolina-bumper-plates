"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DebugData {
  success: boolean
  debug?: {
    order: any
    order_items_parsing: any
    product_matching: any
    invoice_simulation: any
    recommendations: string[]
  }
  error?: string
}

export default function DebugInvoiceCreation({ params }: { params: { id: string } }) {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug-invoice-creation/${params.id}`)
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error("Debug failed:", error)
      setDebugData({ success: false, error: "Debug request failed" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDebug()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Debugging Invoice Creation</h1>
          <p>Analyzing order {params.id}...</p>
        </div>
      </div>
    )
  }

  if (!debugData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Debug Invoice Creation</h1>
          <Button onClick={runDebug}>Run Debug Analysis</Button>
        </div>
      </div>
    )
  }

  if (!debugData.success) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Debug Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Error: {debugData.error}</p>
            <Button onClick={runDebug} className="mt-4">
              Retry Debug
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { debug } = debugData

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoice Creation Debug - Order {params.id}</h1>
        <Button onClick={runDebug}>Refresh Analysis</Button>
      </div>

      {/* Order Information */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Order Number:</strong> {debug?.order.order_number}
            </div>
            <div>
              <strong>Customer Email:</strong> {debug?.order.customer_email}
            </div>
            <div>
              <strong>Subtotal:</strong> ${debug?.order.subtotal}
            </div>
            <div>
              <strong>Status:</strong> {debug?.order.status}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items Parsing */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Order Items Parsing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={debug?.order_items_parsing.success ? "default" : "destructive"}>
                {debug?.order_items_parsing.success ? "✅ Success" : "❌ Failed"}
              </Badge>
              {debug?.order_items_parsing.error && (
                <span className="text-red-600">{debug.order_items_parsing.error}</span>
              )}
            </div>

            <div>
              <strong>Items Found:</strong> {debug?.order_items_parsing.parsed_count}
            </div>

            {debug?.order_items_parsing.items && (
              <div>
                <strong>Parsed Items:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-2 text-sm overflow-x-auto">
                  {JSON.stringify(debug.order_items_parsing.items, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Matching */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Product Matching</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <strong>Weights Needed:</strong> {debug?.product_matching.weights_needed?.join(", ")}
              </div>
              <div>
                <strong>Products Found:</strong> {debug?.product_matching.products_found}
              </div>
              <div>
                <strong>Stripe Ready:</strong> {debug?.product_matching.stripe_ready}
              </div>
            </div>

            {debug?.product_matching.products && (
              <div>
                <strong>Product Details:</strong>
                <div className="mt-2 space-y-2">
                  {debug.product_matching.products.map((product: any) => (
                    <div key={product.id} className="border p-2 rounded">
                      <div className="flex justify-between items-center">
                        <span>
                          {product.title} ({product.weight}lb)
                        </span>
                        <div className="flex gap-2">
                          <Badge variant={product.stripe_product_id ? "default" : "secondary"}>
                            {product.stripe_product_id ? "Stripe Product" : "No Stripe Product"}
                          </Badge>
                          <Badge variant={product.stripe_price_id ? "default" : "secondary"}>
                            {product.stripe_price_id ? "Stripe Price" : "No Stripe Price"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Price: ${product.selling_price} | Active: {product.stripe_active ? "Yes" : "No"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Simulation */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Invoice Items Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Total Items:</strong> {debug?.invoice_simulation.total_items}
              </div>
              <div>
                <strong>Ready for Invoice:</strong> {debug?.invoice_simulation.ready_items}
              </div>
            </div>

            {debug?.invoice_simulation.items && (
              <div>
                <strong>Simulated Invoice Items:</strong>
                <div className="mt-2 space-y-2">
                  {debug.invoice_simulation.items.map((item: any, index: number) => (
                    <div key={index} className="border p-2 rounded">
                      <div className="flex justify-between items-center">
                        <span>
                          {item.product_title} (Qty: {item.quantity})
                        </span>
                        <Badge
                          variant={
                            item.status.includes("✅")
                              ? "default"
                              : item.status.includes("⚠️")
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Weight: {item.weight}lb |
                        {item.unit_amount ? ` Amount: $${(item.unit_amount / 100).toFixed(2)}` : " No pricing"} |
                        {item.stripe_price_id ? ` Stripe Price: ${item.stripe_price_id}` : " No Stripe Price"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {debug?.recommendations.map((rec, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className={rec.includes("❌") ? "text-red-600" : "text-green-600"}>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
