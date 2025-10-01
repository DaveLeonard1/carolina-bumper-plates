"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ResetDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [confirmText, setConfirmText] = useState("")

  const handleReset = async () => {
    if (confirmText !== "CLEAR DATA") {
      alert('Please type "CLEAR DATA" to confirm')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/reset-database", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to clear data: " + (error instanceof Error ? error.message : "Unknown error"),
      })
    } finally {
      setLoading(false)
      setConfirmText("")
    }
  }

  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <div className="px-4 py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4"
                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
              >
                CLEAR TESTING DATA
              </h1>
              <p className="text-base md:text-xl" style={{ color: "#1a1a1a" }}>
                Remove all customers and orders from the database
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: This action cannot be undone</AlertTitle>
            <AlertDescription>
              This will permanently delete all customers and orders from your database. Products and settings will remain
              intact.
            </AlertDescription>
          </Alert>

          {/* Reset Card */}
          <Card className="border-2 border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Clear Testing Data
              </CardTitle>
              <CardDescription>This will delete:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>All customer records</li>
                <li>All orders</li>
                <li>All order items</li>
                <li>All order timeline events</li>
              </ul>

              <div className="pt-4 border-t">
                <label htmlFor="confirmText" className="block text-sm font-medium mb-2">
                  Type <span className="font-bold text-red-600">CLEAR DATA</span> to confirm:
                </label>
                <input
                  id="confirmText"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md"
                  placeholder="CLEAR DATA"
                />
              </div>

              <Button
                onClick={handleReset}
                disabled={loading || confirmText !== "CLEAR DATA"}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    CLEARING DATA...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    CLEAR ALL DATA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                <p>{result.message}</p>
                {result.details && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
