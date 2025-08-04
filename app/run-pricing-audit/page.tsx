"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

// 🔒 Utility: returns the value if it exists, otherwise a sensible fallback
function safe<T>(value: T | undefined, fallback: T): T {
  return value === undefined || value === null ? fallback : value
}

interface AuditResult {
  success: boolean
  message: string
  summary: {
    products: {
      total: number
      precision_issues_fixed: number
      savings_issues_fixed: number
      negative_price_issues: number
    }
    orders: {
      total: number
      total_issues_fixed: number
    }
    all_issues_found: number
  }
  details: {
    precision_issues: Array<{
      id: number
      title: string
      old_selling: number
      new_selling: number
      old_regular: number
      new_regular: number
    }>
    savings_issues: Array<{
      id: number
      title: string
      selling_price: number
      old_regular: number
      new_regular: number
    }>
    negative_issues: Array<{
      id: number
      title: string
      selling_price: number
      regular_price: number
    }>
    order_issues: Array<{
      id: number
      order_number: string
      stored_total: number
      calculated_total: number
      difference: number
    }>
  }
}

export default function RunPricingAuditPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)

  const runAudit = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/run-pricing-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Audit failed:", error)
      setResult({
        success: false,
        message: "Failed to run pricing audit",
        summary: {
          products: { total: 0, precision_issues_fixed: 0, savings_issues_fixed: 0, negative_price_issues: 0 },
          orders: { total: 0, total_issues_fixed: 0 },
          all_issues_found: 0,
        },
        details: {
          precision_issues: [],
          savings_issues: [],
          negative_issues: [],
          order_issues: [],
        },
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pricing Audit System</h1>
        <p className="text-muted-foreground">
          Comprehensive validation and correction of all product prices and order calculations
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run Pricing Audit</CardTitle>
          <CardDescription>
            This will check all products and orders for pricing accuracy and automatically fix any issues found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAudit} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Audit...
              </>
            ) : (
              "Run Comprehensive Pricing Audit"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Audit Results
              </CardTitle>
              <CardDescription>{result.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{safe(result?.summary?.products?.total, 0)}</div>
                  <div className="text-sm text-muted-foreground">Products Audited</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{safe(result?.summary?.orders?.total, 0)}</div>
                  <div className="text-sm text-muted-foreground">Orders Audited</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{safe(result?.summary?.all_issues_found, 0)}</div>
                  <div className="text-sm text-muted-foreground">Issues Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {safe(
                      safe(result?.summary?.products?.precision_issues_fixed, 0) +
                        safe(result?.summary?.products?.savings_issues_fixed, 0) +
                        safe(result?.summary?.orders?.total_issues_fixed, 0),
                      0,
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Issues Fixed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues Details */}
          {safe(result?.details?.precision_issues, []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Decimal Precision Issues Fixed
                  <Badge variant="secondary">{safe(result?.details?.precision_issues, []).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {safe(result?.details?.precision_issues, []).map((issue) => (
                    <div key={issue.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{issue.title}</span>
                      <div className="text-sm">
                        Selling: ${issue.old_selling} → ${issue.new_selling} | Regular: ${issue.old_regular} → $
                        {issue.new_regular}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {safe(result?.details?.savings_issues, []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Invalid Savings Fixed
                  <Badge variant="secondary">{safe(result?.details?.savings_issues, []).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {safe(result?.details?.savings_issues, []).map((issue) => (
                    <div key={issue.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{issue.title}</span>
                      <div className="text-sm">
                        Regular price: ${issue.old_regular} → ${issue.new_regular}
                        (25% above ${issue.selling_price})
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {safe(result?.details?.order_issues, []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Order Total Issues Fixed
                  <Badge variant="secondary">{safe(result?.details?.order_issues, []).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {safe(result?.details?.order_issues, []).map((issue) => (
                    <div key={issue.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">Order {issue.order_number}</span>
                      <div className="text-sm">
                        Total: ${issue.stored_total} → ${issue.calculated_total}
                        (diff: ${issue.difference.toFixed(2)})
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {safe(result?.details?.negative_issues, []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Critical Issues Requiring Manual Review
                  <Badge variant="destructive">{safe(result?.details?.negative_issues, []).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {safe(result?.details?.negative_issues, []).map((issue) => (
                    <div
                      key={issue.id}
                      className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded"
                    >
                      <span className="font-medium">{issue.title}</span>
                      <div className="text-sm text-red-600">
                        Selling: ${issue.selling_price} | Regular: ${issue.regular_price}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {safe(result?.summary?.all_issues_found, 0) === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">All Clear!</h3>
                <p className="text-muted-foreground">No pricing issues were found. All calculations are accurate.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
