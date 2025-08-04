"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle, Database, Settings, Package } from "lucide-react"

interface DebugData {
  success: boolean
  tables: string[]
  columns: Array<{ column_name: string; data_type: string; is_nullable: string }>
  stripeColumns: {
    required: string[]
    existing: string[]
    missing: string[]
  }
  stripeSettings: any
  products: Array<{ id: string; title: string; weight: number; selling_price: number; available: boolean }>
  diagnosis: {
    hasProductsTable: boolean
    hasAllStripeColumns: boolean
    hasStripeSettings: boolean
    hasProducts: boolean
    readyForSync: boolean
  }
  error?: string
}

export default function DebugStripeSetupPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug-stripe-setup")
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error("Error fetching debug data:", error)
      setDebugData({
        success: false,
        error: "Failed to fetch debug data",
        tables: [],
        columns: [],
        stripeColumns: { required: [], existing: [], missing: [] },
        stripeSettings: null,
        products: [],
        diagnosis: {
          hasProductsTable: false,
          hasAllStripeColumns: false,
          hasStripeSettings: false,
          hasProducts: false,
          readyForSync: false,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!debugData || !debugData.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stripe Setup Debug</h1>
          <p className="text-muted-foreground">Critical error detected</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Critical Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{debugData?.error || "Unknown error occurred"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { diagnosis, stripeColumns, stripeSettings, products } = debugData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Stripe Setup Debug</h1>
        <p className="text-muted-foreground">Comprehensive analysis of Stripe integration setup</p>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {diagnosis.readyForSync ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            Overall Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {diagnosis.hasProductsTable ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <p className="text-sm font-medium">Products Table</p>
              <p className="text-xs text-muted-foreground">{diagnosis.hasProductsTable ? "Exists" : "Missing"}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {diagnosis.hasAllStripeColumns ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <p className="text-sm font-medium">Stripe Columns</p>
              <p className="text-xs text-muted-foreground">
                {stripeColumns.existing.length}/{stripeColumns.required.length}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {diagnosis.hasStripeSettings ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <p className="text-sm font-medium">Tax Code Config</p>
              <p className="text-xs text-muted-foreground">
                {diagnosis.hasStripeSettings ? stripeSettings?.default_tax_code : "Missing"}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {diagnosis.hasProducts ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <p className="text-sm font-medium">Products</p>
              <p className="text-xs text-muted-foreground">{products.length} available</p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted">
            <p className="font-medium">
              {diagnosis.readyForSync ? (
                <span className="text-green-600">✅ System ready for Stripe synchronization</span>
              ) : (
                <span className="text-orange-600">⚠️ Setup required before synchronization</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Missing Columns */}
      {stripeColumns.missing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Missing Stripe Columns
            </CardTitle>
            <CardDescription>These columns need to be added to the products table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stripeColumns.missing.map((column) => (
                <Badge key={column} variant="destructive">
                  {column}
                </Badge>
              ))}
            </div>
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Fix Required:</h4>
              <p className="text-sm text-red-700">
                Run the migration script:{" "}
                <code className="bg-red-100 px-2 py-1 rounded">scripts/062-fix-stripe-products-page.sql</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Columns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Products Table Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-medium">Stripe Columns Status:</h4>
            <div className="grid grid-cols-2 gap-2">
              {stripeColumns.required.map((column) => (
                <div key={column} className="flex items-center gap-2">
                  {stripeColumns.existing.includes(column) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">{column}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Stripe Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stripeSettings ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Tax Code</p>
                  <p className="text-sm text-muted-foreground">{stripeSettings.default_tax_code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Mode</p>
                  <p className="text-sm text-muted-foreground">{stripeSettings.stripe_mode || "sandbox"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(stripeSettings.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(stripeSettings.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800">No Stripe settings configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sample Products
          </CardTitle>
          <CardDescription>First 5 products available for sync</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.weight}lb • ${product.selling_price}
                    </p>
                  </div>
                  <Badge variant="outline">Ready</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No products found</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!diagnosis.readyForSync && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Required Actions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                {stripeColumns.missing.length > 0 && (
                  <li>Run migration script: scripts/062-fix-stripe-products-page.sql</li>
                )}
                {!diagnosis.hasStripeSettings && <li>Configure tax code settings</li>}
                <li>Test /admin/stripe-products page</li>
                <li>Sync products with Stripe</li>
              </ol>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={fetchDebugData}>Refresh Analysis</Button>
            {diagnosis.readyForSync && (
              <Button asChild>
                <a href="/admin/stripe-products">Go to Stripe Products</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
