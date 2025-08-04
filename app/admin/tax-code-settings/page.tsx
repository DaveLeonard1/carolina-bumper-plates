"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Save, Settings, Info, RefreshCw } from "lucide-react"

interface StripeSettings {
  id: number
  mode: string
  default_tax_code: string
  webhook_enabled: boolean
  auto_sync_products: boolean
  updated_at: string
}

interface TaxCodeInfo {
  code: string
  description: string
  note: string
}

export default function TaxCodeSettings() {
  const [settings, setSettings] = useState<StripeSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newTaxCode, setNewTaxCode] = useState("")

  const commonTaxCodes: TaxCodeInfo[] = [
    {
      code: "txcd_99999999",
      description: "General - Tangible Goods",
      note: "Generic tax code for general merchandise",
    },
    {
      code: "txcd_20030000",
      description: "Sporting goods",
      note: "Specific to sports and fitness equipment",
    },
    {
      code: "txcd_20020000",
      description: "Exercise equipment",
      note: "Specific to exercise and fitness equipment",
    },
    {
      code: "txcd_10000000",
      description: "General",
      note: "Most general tax classification",
    },
  ]

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/stripe-settings")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setSettings(result.settings)
        setNewTaxCode(result.settings.default_tax_code)
      } else {
        throw new Error(result.error || "Failed to load settings")
      }
    } catch (err) {
      console.error("Load settings error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/admin/stripe-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          default_tax_code: newTaxCode,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setSettings(result.settings)
        setSuccess("Tax code updated successfully!")
      } else {
        throw new Error(result.error || "Failed to save settings")
      }
    } catch (err) {
      console.error("Save settings error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Code Settings</h1>
          <p className="text-muted-foreground">Configure the default tax code for Stripe product synchronization</p>
        </div>
        <Button onClick={loadSettings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Current Tax Code Configuration
              </CardTitle>
              <CardDescription>
                This tax code will be applied to all products during Stripe synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-code">Default Tax Code</Label>
                <Input
                  id="tax-code"
                  value={newTaxCode}
                  onChange={(e) => setNewTaxCode(e.target.value)}
                  placeholder="Enter tax code (e.g., txcd_99999999)"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(settings.updated_at).toLocaleString()}
                </div>
                <Button onClick={saveSettings} disabled={saving || newTaxCode === settings.default_tax_code}>
                  <Save className={`w-4 h-4 mr-2 ${saving ? "animate-spin" : ""}`} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Current Setting</AlertTitle>
                <AlertDescription>
                  All products will use tax code: <Badge variant="outline">{settings.default_tax_code}</Badge>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Tax Codes</CardTitle>
              <CardDescription>Click on any tax code to use it as your default</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commonTaxCodes.map((taxCode) => (
                  <div
                    key={taxCode.code}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      newTaxCode === taxCode.code
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setNewTaxCode(taxCode.code)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={newTaxCode === taxCode.code ? "default" : "outline"}>{taxCode.code}</Badge>
                      {newTaxCode === taxCode.code && <Badge variant="secondary">Selected</Badge>}
                    </div>
                    <div className="text-sm font-medium">{taxCode.description}</div>
                    <div className="text-xs text-muted-foreground">{taxCode.note}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
