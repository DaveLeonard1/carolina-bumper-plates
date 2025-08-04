"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function DebugOrderImagesPage() {
  const params = useParams()
  const [debugData, setDebugData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug-order-images/${params.id}`)
      const result = await response.json()
      setDebugData(result)
    } catch (error) {
      console.error("Debug fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchDebugData()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading debug information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug Order Images - Order #{params.id}</h1>
        <Button onClick={fetchDebugData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {debugData && (
        <div className="grid gap-6">
          {/* Order Items Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Order Items:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugData.debug?.orderItems, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Extracted Weights:</h4>
                  <p className="text-sm">{debugData.debug?.weights?.join(", ") || "None"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Unique Weights:</h4>
                  <p className="text-sm">{debugData.debug?.uniqueWeights?.join(", ") || "None"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Database Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Products Database Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Database Status:</h4>
                  <p className="text-sm">
                    Products table exists: {debugData.debug?.productsTableExists ? "✅ Yes" : "❌ No"}
                  </p>
                  <p className="text-sm">Total products: {debugData.debug?.allProducts?.length || 0}</p>
                  <p className="text-sm">Products with images: {debugData.debug?.imageUrlsFound || 0}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">All Products:</h4>
                  <div className="max-h-60 overflow-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Weight</th>
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Available</th>
                          <th className="text-left p-2">Has Image</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.debug?.allProducts?.map((product, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{product.weight}lb</td>
                            <td className="p-2">{product.title || product.name || "No title"}</td>
                            <td className="p-2">{product.available ? "✅" : "❌"}</td>
                            <td className="p-2">{product.image_url ? "✅" : "❌"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Matching Products for Order:</h4>
                  <div className="space-y-2">
                    {debugData.debug?.matchingProducts?.map((product, index) => (
                      <div key={index} className="border p-3 rounded">
                        <p>
                          <strong>Weight:</strong> {product.weight}lb
                        </p>
                        <p>
                          <strong>Title:</strong> {product.title || product.name || "No title"}
                        </p>
                        <p>
                          <strong>Available:</strong> {product.available ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Image URL:</strong> {product.image_url || "No image"}
                        </p>
                        {product.image_url && (
                          <div className="mt-2">
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={`${product.weight}lb plate`}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                                e.currentTarget.nextElementSibling.style.display = "block"
                              }}
                            />
                            <div
                              style={{ display: "none" }}
                              className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs"
                            >
                              Failed to load
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
