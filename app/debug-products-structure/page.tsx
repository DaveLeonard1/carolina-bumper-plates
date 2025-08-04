"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function DebugProductsStructurePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug-products-structure")
      const result = await response.json()

      console.log("🔍 Debug data:", result)
      setData(result)
    } catch (err) {
      console.error("💥 Error fetching debug data:", err)
      setError("Failed to fetch debug data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading debug data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
            <p className="mb-6">{error}</p>
            <Button onClick={fetchDebugData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Products Table Debug Information</h1>
          <Button onClick={fetchDebugData} className="mb-4">
            Refresh Data
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Table Structure */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Table Structure</h2>
              {data?.tableStructure?.columns?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Column Name</th>
                        <th className="border border-gray-300 p-2 text-left">Data Type</th>
                        <th className="border border-gray-300 p-2 text-left">Nullable</th>
                        <th className="border border-gray-300 p-2 text-left">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tableStructure.columns.map((col: any, index: number) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2 font-mono">{col.column_name}</td>
                          <td className="border border-gray-300 p-2">{col.data_type}</td>
                          <td className="border border-gray-300 p-2">{col.is_nullable}</td>
                          <td className="border border-gray-300 p-2">{col.column_default || "None"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-red-600">
                  No table structure found. Error: {data?.tableStructure?.columnsError || "Unknown"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sample Data */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Sample Products Data</h2>
              {data?.sampleData?.products?.length > 0 ? (
                <div className="space-y-4">
                  {data.sampleData.products.map((product: any, index: number) => (
                    <div key={index} className="bg-gray-100 p-4 rounded">
                      <h3 className="font-bold mb-2">Product {index + 1}</h3>
                      <pre className="text-sm overflow-x-auto">{JSON.stringify(product, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-600">
                  No sample products found. Error: {data?.sampleData?.productsError || "Unknown"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* All Products Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">All Products Summary</h2>
              <p className="mb-4">
                <strong>Total Products:</strong> {data?.allData?.count || 0}
              </p>
              {data?.allData?.allError && <p className="text-red-600 mb-4">Error: {data.allData.allError}</p>}
              {data?.allData?.products?.length > 0 && (
                <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-bold mb-2">All Products Data</h3>
                  <pre className="text-sm overflow-x-auto max-h-96">
                    {JSON.stringify(data.allData.products, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Debug Data */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Raw Debug Response</h2>
              <pre className="text-sm overflow-x-auto bg-gray-100 p-4 rounded max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
