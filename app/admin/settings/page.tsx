"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Save, Globe } from "lucide-react"
import { colorUsage } from "@/lib/colors"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // Business Information
    businessName: "The Plate Yard",
    businessEmail: "info@carolinabumperplates.com",
    businessPhone: "(555) 123-4567",
    businessAddress: "123 Fitness St, Charlotte, NC 28202",
    website: "https://carolinabumperplates.com",

    // Order Settings
    minimumOrderWeight: 10000,
    taxRate: 0.0725,
  })

  const [saving, setSaving] = useState(false)

  const fetchBusinessSettings = async () => {
    try {
      const response = await fetch("/api/admin/business-settings")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const bizSettings = data.settings
          setSettings((prev) => ({
            ...prev,
            businessName: bizSettings.business_name || prev.businessName,
            businessEmail: bizSettings.business_email || prev.businessEmail,
            businessPhone: bizSettings.business_phone || prev.businessPhone,
            businessAddress: bizSettings.business_address || prev.businessAddress,
            website: bizSettings.website || prev.website,
            minimumOrderWeight: bizSettings.minimum_order_weight || prev.minimumOrderWeight,
            taxRate: bizSettings.tax_rate || prev.taxRate,
          }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch business settings:", error)
    }
  }

  useEffect(() => {
    fetchBusinessSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save business settings
      const businessResponse = await fetch("/api/admin/business-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: settings.businessName,
          business_email: settings.businessEmail,
          business_phone: settings.businessPhone,
          business_address: settings.businessAddress,
          website: settings.website,
          minimum_order_weight: settings.minimumOrderWeight,
          tax_rate: settings.taxRate,
        }),
      })

      if (!businessResponse.ok) {
        throw new Error("Failed to save business settings")
      }

      setSaving(false)
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings: " + (error instanceof Error ? error.message : "Unknown error"))
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
            Settings
          </h1>
          <p style={{ color: colorUsage.textMuted }}>Configure your business settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={settings.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={settings.businessEmail}
                onChange={(e) => handleInputChange("businessEmail", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                value={settings.businessPhone}
                onChange={(e) => handleInputChange("businessPhone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                value={settings.businessAddress}
                onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Order Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minimumOrderWeight">Minimum Order Weight (lbs)</Label>
              <Input
                id="minimumOrderWeight"
                type="number"
                value={settings.minimumOrderWeight}
                onChange={(e) => handleInputChange("minimumOrderWeight", Number(e.target.value))}
              />
              <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                Minimum weight required to place bulk orders
              </p>
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.0001"
                value={(settings.taxRate * 100).toFixed(2)}
                onChange={(e) => handleInputChange("taxRate", Number(e.target.value) / 100)}
              />
              <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                Sales tax rate for North Carolina
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
