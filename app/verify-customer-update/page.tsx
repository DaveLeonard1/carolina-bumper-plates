"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface VerificationResult {
  success: boolean
  customer: any
  verification: Record<string, { expected: string; actual: string; matches: boolean }>
  duplicates: any[]
  hasDuplicates: boolean
  isRecentlyUpdated: boolean
  updatedAt: string
  timeSinceUpdate: string
  summary: {
    totalFields: number
    matchingFields: number
    mismatchedFields: Array<{ field: string; expected: string; actual: string }>
  }
}

export default function VerifyCustomerUpdatePage() {
  const [userId, setUserId] = useState("")
  const [expectedData, setExpectedData] = useState({
    name: "",
    email: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    delivery_option: "door",
  })
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async () => {
    if (!userId.trim()) {
      setError("Please enter a User ID")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/verify-customer-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          expectedData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setResult(data)
    } catch (err) {
      console.error("Verification error:", err)
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError("")
    setUserId("")
    setExpectedData({
      name: "",
      email: "",
      phone: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      delivery_option: "door",
    })
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: colorUsage.backgroundLight }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
            CUSTOMER UPDATE VERIFICATION
          </h1>
          <p className="text-xl" style={{ color: colorUsage.textMuted }}>
            Verify that customer profile updates are correctly saved to the database
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Verification Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID (UUID)</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter the user's UUID"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Expected Customer Data:</h3>

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={expectedData.name}
                    onChange={(e) => setExpectedData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Expected name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={expectedData.email}
                    onChange={(e) => setExpectedData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Expected email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={expectedData.phone}
                    onChange={(e) => setExpectedData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Expected phone"
                  />
                </div>

                <div>
                  <Label htmlFor="street_address">Street Address</Label>
                  <Input
                    id="street_address"
                    value={expectedData.street_address}
                    onChange={(e) => setExpectedData((prev) => ({ ...prev, street_address: e.target.value }))}
                    placeholder="Expected street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={expectedData.city}
                      onChange={(e) => setExpectedData((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Expected city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={expectedData.state}
                      onChange={(e) => setExpectedData((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="Expected state"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={expectedData.zip_code}
                    onChange={(e) => setExpectedData((prev) => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="Expected ZIP code"
                    className="w-32"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1"
                  style={{ backgroundColor: colorUsage.buttonSecondary, color: colorUsage.textOnDark }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Update
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : result && !result.success ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                Verification Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: "#fef2f2" }}>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-800">Error</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: result.success ? "#f0f9ff" : "#fef2f2" }}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-semibold">
                        {result.success ? "✅ All Data Verified" : "❌ Data Mismatch Detected"}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Fields Matching:</strong> {result.summary.matchingFields}/{result.summary.totalFields}
                      </p>
                      <p>
                        <strong>Last Updated:</strong> {result.timeSinceUpdate}
                      </p>
                      <p>
                        <strong>Recently Updated:</strong> {result.isRecentlyUpdated ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Duplicate Records:</strong> {result.hasDuplicates ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  {/* Field-by-Field Verification */}
                  <div>
                    <h3 className="font-semibold mb-3">Field Verification:</h3>
                    <div className="space-y-2">
                      {Object.entries(result.verification).map(([field, data]) => (
                        <div
                          key={field}
                          className="flex items-center justify-between p-3 rounded border"
                          style={{
                            backgroundColor: data.matches ? "#f0f9ff" : "#fef2f2",
                            borderColor: data.matches ? "#3b82f6" : "#ef4444",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {data.matches ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium capitalize">{field.replace("_", " ")}</span>
                          </div>
                          <div className="text-sm text-right">
                            <div>
                              <strong>Expected:</strong> "{data.expected}"
                            </div>
                            <div>
                              <strong>Actual:</strong> "{data.actual}"
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mismatched Fields */}
                  {result.summary.mismatchedFields.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-red-700">❌ Mismatched Fields:</h3>
                      <div className="space-y-2">
                        {result.summary.mismatchedFields.map((mismatch, index) => (
                          <div key={index} className="p-3 rounded" style={{ backgroundColor: "#fef2f2" }}>
                            <div className="font-medium text-red-800 capitalize">
                              {mismatch.field?.replace("_", " ")}
                            </div>
                            <div className="text-sm text-red-700">
                              Expected: "{mismatch.expected}" → Got: "{mismatch.actual}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicate Check */}
                  {result.hasDuplicates && (
                    <div>
                      <h3 className="font-semibold mb-3 text-orange-700">⚠️ Duplicate Records Found:</h3>
                      <div className="space-y-2">
                        {result.duplicates.map((duplicate, index) => (
                          <div key={index} className="p-3 rounded" style={{ backgroundColor: "#fef3cd" }}>
                            <div className="font-medium">ID: {duplicate.id}</div>
                            <div className="text-sm">
                              Name: {duplicate.name} | Email: {duplicate.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Customer Data */}
                  <div>
                    <h3 className="font-semibold mb-3">Raw Database Record:</h3>
                    <Textarea
                      value={JSON.stringify(result.customer, null, 2)}
                      readOnly
                      className="font-mono text-xs h-40"
                    />
                  </div>
                </div>
              )}

              {!result && !error && !loading && (
                <div className="text-center py-8" style={{ color: colorUsage.textMuted }}>
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a User ID and expected data to verify customer updates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
