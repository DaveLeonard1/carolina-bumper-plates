"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugOrdersSchemaPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const debugSchema = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-orders-schema")
      const data = await response.json()
      setResult(data)
      console.log("Orders schema debug result:", data)
    } catch (error) {
      console.error("Failed to debug schema:", error)
      setResult({
        success: false,
        error: "Failed to debug schema",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Orders Table Schema Debug</CardTitle>
            <CardDescription>Debug the actual structure of the orders table to fix the pricing audit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={debugSchema} disabled={loading} className="w-full">
              {loading ? "Debugging Schema..." : "Debug Orders Table Schema"}
            </Button>

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">✅ Schema Debug Successful</h3>
                      <p className="text-green-700">{result.message}</p>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Actual Columns in Orders Table</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {result.actualColumns?.map((column: string, index: number) => (
                            <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                              {column}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Sample Orders Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
                          {JSON.stringify(result.sampleOrders, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">❌ Schema Debug Failed</h3>
                    <p className="text-red-700 mb-2">{result.error}</p>
                    {result.details && <p className="text-red-600 text-sm font-mono">{result.details}</p>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
