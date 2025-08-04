"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface DebugData {
  order: any
  orderItems: any
  products: any
  analysis: any[]
  issues: any
}

export default function DebugInvoiceDataPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DebugData | null>(null)
  const [error, setError] = useState("")

  const loadDebugData = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/debug-invoice-data/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setData(result.debug)
      } else {
        setError(result.error || "Failed to load debug data")
      }
    } catch (err) {
      console.error("Debug data error:", err)
      setError("Failed to load debug data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDebugData()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading invoice debug data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <p>No debug data available</p>
      </div>
    )
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoice Debug Data - Order #{data.order.order_number}</h1>
        <Button onClick={loadDebugData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Issues Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Issues Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(!data.issues.noOrderItems)}
              <span className={data.issues.noOrderItems ? "text-red-600" : "text-green-600"}>
                Order Items: {data.orderItems.count}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!data.issues.noProducts)}
              <span className={data.issues.noProducts ? "text-red-600" : "text-green-600"}>
                Products Found: {data.products.found.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(data.issues.missingStripeData === 0)}
              <span className={data.issues.missingStripeData > 0 ? "text-red-600" : "text-green-600"}>
                Missing Stripe Data: {data.issues.missingStripeData}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!data.issues.missingAddress)}
              <span className={data.issues.missingAddress ? "text-red-600" : "text-green-600"}>
                Billing Address: {data.issues.missingAddress ? "Missing" : "Present"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Basic Info</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>ID:</strong> {data.order.id}
                </p>
                <p>
                  <strong>Order Number:</strong> {data.order.order_number}
                </p>
                <p>
                  <strong>Status:</strong> <Badge>{data.order.status}</Badge>
                </p>
                <p>
                  <strong>Payment Status:</strong> <Badge>{data.order.payment_status || "N/A"}</Badge>
                </p>
                <p>
                  <strong>Subtotal:</strong> ${data.order.subtotal}
                </p>
                <p>
                  <strong>Total Weight:</strong> {data.order.total_weight}lbs
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Customer Info</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {data.order.customer_name}
                </p>
                <p>
                  <strong>Email:</strong> {data.order.customer_email}
                </p>
                <p>
                  <strong>Phone:</strong> {data.order.customer_phone || "N/A"}
                </p>
                <div className="mt-2">
                  <strong>Address:</strong>
                  {data.order.street_address ? (
                    <div className="ml-2">
                      <p>{data.order.street_address}</p>
                      <p>
                        {data.order.city}, {data.order.state} {data.order.zip_code}
                      </p>
                    </div>
                  ) : (
                    <span className="text-red-600 ml-2">Missing</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="font-medium mb-2">Raw Order Items Data</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(data.orderItems.raw, null, 2)}
            </pre>
          </div>

          {data.analysis.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium">Parsed Items with Product Mapping</h4>
              {data.analysis.map((item: any, index: number) => (
                <div key={index} className="border rounded p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-sm">Order Item</h5>
                      <div className="text-xs space-y-1">
                        <p>
                          <strong>Weight:</strong> {item.orderItem.weight}lbs
                        </p>
                        <p>
                          <strong>Quantity:</strong> {item.orderItem.quantity}
                        </p>
                        <p>
                          <strong>Price:</strong> ${item.orderItem.price}
                        </p>
                        <p>
                          <strong>Unit Amount:</strong> ${item.calculatedUnitAmount / 100}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">Product Match</h5>
                      {item.product ? (
                        <div className="text-xs space-y-1">
                          <p>
                            <strong>Title:</strong> {item.product.title}
                          </p>
                          <p>
                            <strong>Available:</strong> {item.product.available ? "Yes" : "No"}
                          </p>
                          <p>
                            <strong>Selling Price:</strong> ${item.product.selling_price}
                          </p>
                        </div>
                      ) : (
                        <p className="text-red-600 text-xs">No product found</p>
                      )}
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">Stripe Integration</h5>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.hasStripeProduct)}
                          <span>Product ID: {item.product?.stripe_product_id || "Missing"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.hasStripePrice)}
                          <span>Price ID: {item.product?.stripe_price_id || "Missing"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                No order items found. This is why the invoice shows $0.00 and no line items.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Products Database */}
      <Card>
        <CardHeader>
          <CardTitle>Products Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-gray-600">Weights needed: {data.products.weights.join(", ") || "None"}</p>
          </div>

          {data.products.found.length > 0 ? (
            <div className="space-y-2">
              {data.products.found.map((product: any, index: number) => (
                <div key={index} className="border rounded p-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <strong>Weight:</strong> {product.weight}lbs
                    </div>
                    <div>
                      <strong>Title:</strong> {product.title}
                    </div>
                    <div>
                      <strong>Price:</strong> ${product.selling_price}
                    </div>
                    <div>
                      <Badge className={product.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {product.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                No products found in database for the required weights.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
