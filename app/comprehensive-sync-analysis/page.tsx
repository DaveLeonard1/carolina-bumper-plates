"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  DollarSign,
  Package,
  Wrench,
  Info,
} from "lucide-react"

interface ProductAnalysis {
  database_product: any
  stripe_product: any
  stripe_prices: any[]
  sync_issues: string[]
  tax_code_info: {
    current_tax_code?: string
    expected_tax_code?: string
    tax_code_source: string
    needs_update: boolean
  }
  last_database_update?: string
  last_stripe_update?: string
  sync_recommendations: string[]
}

interface TaxCodeAnalysis {
  current_setting: string
  location: string
  can_be_automated: boolean
  manual_steps_required: string[]
  stripe_tax_codes: any[]
}

interface AnalysisData {
  analysis: ProductAnalysis[]
  tax_code_analysis: TaxCodeAnalysis
  summary: {
    total_products: number
    products_with_issues: number
    products_never_synced: number
    products_with_name_issues: number
    products_with_price_issues: number
    products_needing_tax_code: number
  }
  recommendations: {
    immediate_actions: string[]
    long_term_improvements: string[]
  }
}

export default function ComprehensiveSyncAnalysis() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fixResults, setFixResults] = useState<any>(null)

  const runAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/comprehensive-sync-analysis")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (err) {
      console.error("Analysis error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const fixSyncIssues = async () => {
    try {
      setFixing(true)
      setError(null)

      const response = await fetch("/api/fix-sync-issues", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setFixResults(result)
        // Re-run analysis to see the results
        await runAnalysis()
      } else {
        throw new Error(result.error || "Fix operation failed")
      }
    } catch (err) {
      console.error("Fix error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    runAnalysis()
  }, [])

  const getIssueIcon = (issueCount: number) => {
    if (issueCount === 0) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (issueCount <= 2) return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Sync Analysis</h1>
          <p className="text-muted-foreground">
            Detailed investigation of product name and tax code synchronization issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAnalysis} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Analyzing..." : "Refresh Analysis"}
          </Button>
          <Button onClick={fixSyncIssues} disabled={fixing || !data} variant="default">
            <Wrench className={`w-4 h-4 mr-2 ${fixing ? "animate-spin" : ""}`} />
            {fixing ? "Fixing..." : "Fix All Issues"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fixResults && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Fix Operation Complete</AlertTitle>
          <AlertDescription>
            Successfully processed {fixResults.summary.total_processed} products. {fixResults.summary.products_updated}{" "}
            products were updated.
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="products">Product Analysis</TabsTrigger>
            <TabsTrigger value="taxcodes">Tax Code Configuration</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Total Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.summary.total_products}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    With Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{data.summary.products_with_issues}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Name Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{data.summary.products_with_name_issues}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Price Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{data.summary.products_with_price_issues}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Need Tax Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{data.summary.products_needing_tax_code}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Never Synced</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{data.summary.products_never_synced}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product-by-Product Analysis</CardTitle>
                <CardDescription>Detailed sync status for each product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.analysis.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {getIssueIcon(item.sync_issues.length)}
                            {item.database_product.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.database_product.weight}lb • ${item.database_product.selling_price} • ID:{" "}
                            {item.database_product.id}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={item.sync_issues.length === 0 ? "default" : "destructive"}>
                            {item.sync_issues.length} Issues
                          </Badge>
                          {item.tax_code_info.current_tax_code && (
                            <Badge variant="outline" className="text-xs">
                              Tax: {item.tax_code_info.current_tax_code}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {item.sync_issues.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-medium text-sm text-red-700 mb-2">Issues Found:</h4>
                          <div className="space-y-1">
                            {item.sync_issues.map((issue, issueIndex) => (
                              <div key={issueIndex} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {issue}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.sync_recommendations.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-medium text-sm text-blue-700 mb-2">Recommendations:</h4>
                          <div className="space-y-1">
                            {item.sync_recommendations.map((rec, recIndex) => (
                              <div key={recIndex} className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <strong>DB Updated:</strong>{" "}
                          {item.last_database_update ? new Date(item.last_database_update).toLocaleString() : "Unknown"}
                        </div>
                        <div>
                          <strong>Stripe Updated:</strong>{" "}
                          {item.last_stripe_update ? new Date(item.last_stripe_update).toLocaleString() : "Never"}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxcodes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Tax Code Configuration Analysis
                </CardTitle>
                <CardDescription>Current tax code settings and configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Current Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Setting:</strong> {data.tax_code_analysis.current_setting}
                      </div>
                      <div>
                        <strong>Location:</strong> {data.tax_code_analysis.location}
                      </div>
                      <div>
                        <strong>Can be automated:</strong> {data.tax_code_analysis.can_be_automated ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Available Tax Codes</h3>
                    <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                      {data.tax_code_analysis.stripe_tax_codes.map((code, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <strong>{code.id}</strong>: {code.description}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {data.tax_code_analysis.manual_steps_required.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Manual Steps Required</h3>
                    <div className="space-y-2">
                      {data.tax_code_analysis.manual_steps_required.map((step, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <span className="text-sm">{step}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Immediate Actions</CardTitle>
                  <CardDescription>Steps to take right now</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recommendations.immediate_actions.map((action, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                          <span className="text-sm">{action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Long-term Improvements</CardTitle>
                  <CardDescription>Future enhancements to consider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recommendations.long_term_improvements.map((improvement, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-start gap-2">
                          <Settings className="w-4 h-4 text-blue-600 mt-0.5" />
                          <span className="text-sm">{improvement}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
