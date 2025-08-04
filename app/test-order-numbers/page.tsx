"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestOrderNumbers() {
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-order-numbers")
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error("Test failed:", error)
      setTestResults({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Order Number System Test</h1>
        <p className="text-gray-600">Test the simplified order number generation system</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New Order Number Format</CardTitle>
          <CardDescription>Simplified, user-friendly order numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Format:</h3>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded">CBP-XXXX</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Examples:</h3>
              <ul className="space-y-1 font-mono text-sm">
                <li>CBP-1000</li>
                <li>CBP-1001</li>
                <li>CBP-1234</li>
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Benefits:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Short and memorable (8 characters total)</li>
              <li>Clear brand identification (CBP prefix)</li>
              <li>Sequential numbering for easy tracking</li>
              <li>Professional appearance</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Order Number Generation</CardTitle>
          <CardDescription>Create test orders to verify the new system works</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTest} disabled={loading} className="mb-4">
            {loading ? "Running Test..." : "Run Test"}
          </Button>

          {testResults && (
            <div className="space-y-4">
              {testResults.success ? (
                <>
                  <div>
                    <h3 className="font-semibold text-green-600 mb-2">✅ Test Results</h3>
                    {testResults.testResults?.map((result, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded mb-2">
                        {result.error ? (
                          <p className="text-red-600">Error: {result.error}</p>
                        ) : (
                          <div>
                            <p className="font-mono font-semibold">{result.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {result.customer_name} - {new Date(result.created_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {testResults.recentOrders && testResults.recentOrders.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Recent Orders</h3>
                      <div className="space-y-2">
                        {testResults.recentOrders.map((order, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <p className="font-mono font-semibold">{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {order.customer_name} - {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-50 p-4 rounded">
                  <h3 className="font-semibold text-red-600 mb-2">❌ Test Failed</h3>
                  <p className="text-red-600">{testResults.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
