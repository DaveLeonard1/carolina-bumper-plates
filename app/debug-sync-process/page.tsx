"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"

interface InvestigationResult {
  database_id: string
  database_title: string
  database_weight: number
  database_price: number
  stripe_product_id?: string
  stripe_price_id?: string
  last_synced?: string
  sync_status: string
  stripe_data?: {
    id: string
    name: string
    description: string
    active: boolean
    metadata: Record<string, string>
    updated: number
  }
  issues: string[]
}

interface Summary {
  total_products: number
  never_synced: number
  in_sync: number
  out_of_sync: number
  stripe_errors: number
  products_with_issues: number
}

export default function DebugSyncProcess() {
  const [investigation, setInvestigation] = useState<InvestigationResult[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runInvestigation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/debug-sync-process")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setInvestigation(data.investigation)
        setSummary(data.summary)
      } else {
        throw new Error(data.error || "Investigation failed")
      }
    } catch (err) {
      console.error("Investigation error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const forceSyncProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/force-sync-product/${productId}`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        // Refresh investigation after sync
        await runInvestigation()
      } else {
        throw new Error(data.error || "Force sync failed")
      }
    } catch (err) {
      console.error("Force sync error:", err)
      setError(err instanceof Error ? err.message : "Force sync failed")
    }
  }

  useEffect(() => {
    runInvestigation()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_sync":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            In Sync
          </Badge>
        )
      case "out_of_sync":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Out of Sync
          </Badge>
        )
      case "never_synced":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Never Synced
          </Badge>
        )
      case "stripe_error":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Stripe Error
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sync Process Investigation</h1>
          <p className="text-muted-foreground">Debug product name synchronization issues</p>
        </div>
        <Button onClick={runInvestigation} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Investigating..." : "Refresh Investigation"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_products}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">In Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.in_sync}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Out of Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.out_of_sync}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Never Synced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.never_synced}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Stripe Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.stripe_errors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">With Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.products_with_issues}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Sync Investigation Results</CardTitle>
          <CardDescription>Detailed analysis of each product's synchronization status</CardDescription>
        </CardHeader>
        <CardContent>
          {investigation.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? "Running investigation..." : "No investigation data available"}
            </div>
          ) : (
            <div className="space-y-4">
              {investigation.map((item) => (
                <Card key={item.database_id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{item.database_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.database_weight}lb • ${item.database_price} • ID: {item.database_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.sync_status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => forceSyncProduct(item.database_id)}
                        disabled={loading}
                      >
                        Force Sync
                      </Button>
                    </div>
                  </div>

                  {item.stripe_data && (
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <h4 className="font-medium mb-2">Current Stripe Data:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <strong>Name:</strong> {item.stripe_data.name}
                        </div>
                        <div>
                          <strong>ID:</strong> {item.stripe_data.id}
                        </div>
                        <div>
                          <strong>Active:</strong> {item.stripe_data.active ? "Yes" : "No"}
                        </div>
                        <div>
                          <strong>Updated:</strong> {new Date(item.stripe_data.updated * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {item.issues.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm text-red-700">Issues Found:</h4>
                      {item.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.last_synced && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Last synced: {new Date(item.last_synced).toLocaleString()}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
