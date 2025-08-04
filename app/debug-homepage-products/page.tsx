"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, CheckCircle, AlertCircle, Database, Bug } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface DebugData {
  success: boolean
  debug: {
    tableExists: boolean
    allProductsCount: number
    availableProductsCount: number
    finalProductsCount: number
    dataQualityReport: Array<{
      id: number
      title: string
      weight: number
      selling_price: number
      regular_price: number
      available: boolean
      issues: string[]
    }>
    sampleProducts: Array<any>
    errors: {
      tableError: string | null
      allProductsError: string | null
      availableError: string | null
      finalError: string | null
    }
  }
  products: Array<any>
  timestamp: string
}

export default function DebugHomepageProductsPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug-homepage-products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      console.error("Debug fetch error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <div className="px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <RefreshCw className="h-16 w-16 animate-spin mx-auto mb-6" style={{ color: colorUsage.textMuted }} />
            <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              RUNNING DIAGNOSTICS
            </h1>
            <p className="text-lg" style={{ color: colorUsage.textMuted }}>
              Checking product data and database connectivity...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
                HOMEPAGE PRODUCTS DEBUG
              </h1>
              <p style={{ color: colorUsage.textMuted }}>Comprehensive diagnostics for product data retrieval issues</p>
            </div>
            <Button onClick={fetchDebugData} className="font-semibold">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {error && (
            <Card className="p-6 mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">Debug Error: {error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {debugData && (
            <div className="space-y-6">
              {/* Overall Status */}
              <Card className="p-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    {debugData.success ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    <h2 className="text-xl font-bold">
                      Overall Status: {debugData.success ? "HEALTHY" : "ISSUES DETECTED"}
                    </h2>
                  </div>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    Last checked: {new Date(debugData.timestamp).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              {/* Database Connectivity */}
              <Card className="p-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-6 w-6" style={{ color: colorUsage.textOnLight }} />
                    <h2 className="text-xl font-bold">Database Connectivity</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span>Products Table Exists:</span>
                      <span className={debugData.debug?.tableExists ? "text-green-600" : "text-red-600"}>
                        {debugData.debug?.tableExists ? "✓ Yes" : "✗ No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Products:</span>
                      <span className="font-semibold">{debugData.debug?.allProductsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Products:</span>
                      <span className="font-semibold">{debugData.debug?.availableProductsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final Count:</span>
                      <span className="font-semibold">{debugData.debug?.finalProductsCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Details */}
              {debugData.debug?.errors && (
                <Card className="p-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Bug className="h-6 w-6 text-orange-500" />
                      <h2 className="text-xl font-bold">Error Analysis</h2>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(debugData.debug.errors).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                          <span className={value ? "text-red-600" : "text-green-600"}>{value || "✓ No errors"}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Quality Report */}
              {debugData.debug?.dataQualityReport && debugData.debug.dataQualityReport.length > 0 && (
                <Card className="p-6">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-bold mb-4">Data Quality Report</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Title</th>
                            <th className="text-left p-2">Weight</th>
                            <th className="text-left p-2">Price</th>
                            <th className="text-left p-2">Available</th>
                            <th className="text-left p-2">Issues</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debugData.debug.dataQualityReport.map((product) => (
                            <tr key={product.id} className="border-b">
                              <td className="p-2">{product.id}</td>
                              <td className="p-2">{product.title || "N/A"}</td>
                              <td className="p-2">{product.weight || "N/A"}</td>
                              <td className="p-2">${product.selling_price || "N/A"}</td>
                              <td className="p-2">
                                <span className={product.available ? "text-green-600" : "text-red-600"}>
                                  {product.available ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="p-2">
                                {product.issues.length > 0 ? (
                                  <span className="text-red-600">{product.issues.join(", ")}</span>
                                ) : (
                                  <span className="text-green-600">None</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sample Products */}
              {debugData.debug?.sampleProducts && debugData.debug.sampleProducts.length > 0 && (
                <Card className="p-6">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-bold mb-4">Sample Products (API Response)</h2>
                    <div className="space-y-4">
                      {debugData.debug.sampleProducts.map((product) => (
                        <div key={product.id} className="border rounded p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="font-semibold">{product.title}</p>
                              <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                                Weight: {product.weight} lbs
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold">${product.selling_price}</p>
                              <p className="text-sm line-through" style={{ color: colorUsage.textDisabled }}>
                                ${product.regular_price}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card className="p-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4">Recommended Actions</h2>
                  <div className="space-y-2">
                    {debugData.debug?.finalProductsCount === 0 && (
                      <p className="text-orange-600">• No products available - check database seeding</p>
                    )}
                    {debugData.debug?.errors?.tableError && (
                      <p className="text-red-600">• Database table issues detected - run migration scripts</p>
                    )}
                    {debugData.debug?.dataQualityReport?.some((p) => p.issues.length > 0) && (
                      <p className="text-orange-600">• Data quality issues found - clean up product data</p>
                    )}
                    {debugData.success && debugData.debug?.finalProductsCount > 0 && (
                      <p className="text-green-600">• ✓ All systems operational - products should display correctly</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
