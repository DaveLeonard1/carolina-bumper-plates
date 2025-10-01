"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Settings, Save, Globe, AlertTriangle, Zap, TestTube, CheckCircle2, XCircle, Info } from "lucide-react"
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
    shippingRate: 0.5,

    // Email Settings
    emailNotifications: true,
    orderConfirmationEmail: true,
    invoiceEmail: true,

    // Pickup Settings
    pickupLocation: "Charlotte, NC",
    pickupInstructions: "We will contact you 24-48 hours before pickup to coordinate delivery.",

    // Zapier Settings
    zapierWebhookUrl: "",
    zapierWebhookEnabled: false,
    zapierWebhookTimeout: 30,
    zapierRetryAttempts: 3,
    zapierRetryDelay: 5,
    zapierIncludeCustomerData: true,
    zapierIncludeOrderItems: true,
    zapierIncludePricingData: true,
    zapierIncludeShippingData: true,
    zapierWebhookSecret: "",
  })

  const [saving, setSaving] = useState(false)
  const [zapierStats, setZapierStats] = useState({
    total_sent: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    avg_response_time: 0,
    payment_link_webhooks: 0,
    order_completed_webhooks: 0,
  })
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const fetchZapierSettings = async () => {
    try {
      const response = await fetch("/api/admin/zapier-settings")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const zapierSettings = data.settings
          setSettings((prev) => ({
            ...prev,
            zapierWebhookUrl: zapierSettings.webhook_url || "",
            zapierWebhookEnabled: zapierSettings.webhook_enabled || false,
            zapierWebhookTimeout: zapierSettings.webhook_timeout || 30,
            zapierRetryAttempts: zapierSettings.webhook_retry_attempts || 3,
            zapierRetryDelay: zapierSettings.webhook_retry_delay || 5,
            zapierIncludeCustomerData: zapierSettings.include_customer_data || true,
            zapierIncludeOrderItems: zapierSettings.include_order_items || true,
            zapierIncludePricingData: zapierSettings.include_pricing_data || true,
            zapierIncludeShippingData: zapierSettings.include_shipping_data || true,
          }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch Zapier settings:", error)
    }
  }

  const fetchZapierStats = async () => {
    try {
      const response = await fetch("/api/admin/zapier-webhook-stats")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setZapierStats(data.stats)
        }
      }
    } catch (error) {
      console.error("Failed to fetch Zapier stats:", error)
    }
  }

  const testZapierWebhook = async (eventType: string) => {
    if (!settings.zapierWebhookUrl) {
      alert("Please enter a webhook URL first")
      return
    }

    setTestingWebhook(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/admin/test-zapier-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: settings.zapierWebhookUrl,
          event_type: eventType,
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to test webhook",
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  useEffect(() => {
    fetchZapierSettings()
    fetchZapierStats()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save Zapier settings
      const zapierResponse = await fetch("/api/admin/zapier-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: settings.zapierWebhookUrl || null,
          webhook_enabled: settings.zapierWebhookEnabled,
          webhook_timeout: settings.zapierWebhookTimeout,
          webhook_retry_attempts: settings.zapierRetryAttempts,
          webhook_retry_delay: settings.zapierRetryDelay,
          include_customer_data: settings.zapierIncludeCustomerData,
          include_order_items: settings.zapierIncludeOrderItems,
          include_pricing_data: settings.zapierIncludePricingData,
          include_shipping_data: settings.zapierIncludeShippingData,
          webhook_secret: settings.zapierWebhookSecret || null,
        }),
      })

      if (!zapierResponse.ok) {
        throw new Error("Failed to save Zapier settings")
      }

      // Simulate API call for other settings
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaving(false)

      // Refresh stats after saving
      await fetchZapierStats()

      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings: " + error.message)
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
          <p style={{ color: colorUsage.textMuted }}>Configure your business settings and Zapier automation</p>
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
            <div>
              <Label htmlFor="shippingRate">Shipping Rate (per lb)</Label>
              <Input
                id="shippingRate"
                type="number"
                step="0.01"
                value={settings.shippingRate}
                onChange={(e) => handleInputChange("shippingRate", Number(e.target.value))}
              />
              <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
                Cost per pound for local delivery
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zapier Integration - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Zapier Email Automation
          </CardTitle>
          <p className="text-sm" style={{ color: colorUsage.textMuted }}>
            Automatically send payment links and order completion notifications via Zapier
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5" style={{ color: colorUsage.textMuted }} />
              <div>
                <Label className="text-base font-medium">
                  {settings.zapierWebhookEnabled ? "Automation Enabled" : "Automation Disabled"}
                </Label>
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  {settings.zapierWebhookEnabled
                    ? "Automatically sending webhooks to Zapier"
                    : "Webhook automation is currently disabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.zapierWebhookEnabled}
              onCheckedChange={(checked) => handleInputChange("zapierWebhookEnabled", checked)}
            />
          </div>

          {/* Webhook URL */}
          <div>
            <Label htmlFor="zapierWebhookUrl">Zapier Webhook URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="zapierWebhookUrl"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={settings.zapierWebhookUrl}
                onChange={(e) => handleInputChange("zapierWebhookUrl", e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testZapierWebhook("payment_link_created")}
                  disabled={testingWebhook || !settings.zapierWebhookUrl}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  Test Payment Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testZapierWebhook("order_completed")}
                  disabled={testingWebhook || !settings.zapierWebhookUrl}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  Test Order Complete
                </Button>
              </div>
            </div>
            <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
              Enter your Zapier webhook URL to enable automatic email notifications
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 border rounded-lg ${
                testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                    {testResult.message}
                  </h4>
                  <div className="text-sm mt-1 space-y-1">
                    <p>Event Type: {testResult.event_type}</p>
                    <p>Status: {testResult.status}</p>
                    <p>Response Time: {testResult.response_time_ms}ms</p>
                    {testResult.error && <p className="text-red-700">Error: {testResult.error}</p>}
                    {testResult.response_body && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">Response Body</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {testResult.response_body}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{zapierStats.total_sent}</div>
              <div className="text-sm text-blue-700">Total Sent</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{zapierStats.successful}</div>
              <div className="text-sm text-green-700">Successful</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{zapierStats.failed}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{zapierStats.avg_response_time}ms</div>
              <div className="text-sm text-purple-700">Avg Response</div>
            </div>
          </div>

          {/* Event Type Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{zapierStats.payment_link_webhooks}</div>
              <div className="text-sm text-orange-700">Payment Link Emails</div>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{zapierStats.order_completed_webhooks}</div>
              <div className="text-sm text-teal-700">Order Complete Emails</div>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zapierWebhookTimeout">Timeout (seconds)</Label>
              <Input
                id="zapierWebhookTimeout"
                type="number"
                min="5"
                max="300"
                value={settings.zapierWebhookTimeout}
                onChange={(e) => handleInputChange("zapierWebhookTimeout", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="zapierRetryAttempts">Retry Attempts</Label>
              <Input
                id="zapierRetryAttempts"
                type="number"
                min="0"
                max="10"
                value={settings.zapierRetryAttempts}
                onChange={(e) => handleInputChange("zapierRetryAttempts", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Data Inclusion Options */}
          <div>
            <Label className="text-base font-medium">Data to Include in Webhooks</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="zapierIncludeCustomerData"
                  checked={settings.zapierIncludeCustomerData}
                  onChange={(e) => handleInputChange("zapierIncludeCustomerData", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="zapierIncludeCustomerData">Customer Information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="zapierIncludeOrderItems"
                  checked={settings.zapierIncludeOrderItems}
                  onChange={(e) => handleInputChange("zapierIncludeOrderItems", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="zapierIncludeOrderItems">Order Items</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="zapierIncludePricingData"
                  checked={settings.zapierIncludePricingData}
                  onChange={(e) => handleInputChange("zapierIncludePricingData", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="zapierIncludePricingData">Pricing Details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="zapierIncludeShippingData"
                  checked={settings.zapierIncludeShippingData}
                  onChange={(e) => handleInputChange("zapierIncludeShippingData", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="zapierIncludeShippingData">Shipping Information</Label>
              </div>
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <Label htmlFor="zapierWebhookSecret">Webhook Secret (Optional)</Label>
            <Input
              id="zapierWebhookSecret"
              type="password"
              placeholder="Enter secret for webhook signature verification"
              value={settings.zapierWebhookSecret}
              onChange={(e) => handleInputChange("zapierWebhookSecret", e.target.value)}
            />
            <p className="text-sm mt-1" style={{ color: colorUsage.textMuted }}>
              If provided, webhooks will include an X-Webhook-Signature header for verification
            </p>
          </div>

          {/* Workflow Documentation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-800">Automated Email Workflow</h4>
                <div className="text-sm text-blue-700 mt-1 space-y-2">
                  <p>
                    <strong>Payment Link Created:</strong> When an admin creates a payment link, Zapier receives order
                    details and customer email to send the payment link automatically.
                  </p>
                  <p>
                    <strong>Order Completed:</strong> When payment is received and order is marked as paid, Zapier
                    receives completion notification to send a thank you email with order details.
                  </p>
                  <p>
                    <strong>Reliable Delivery:</strong> Webhooks are queued and retried automatically if delivery fails,
                    ensuring no emails are missed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-800">Reset Database</h4>
              <p className="text-sm text-red-600">
                Permanently delete all orders, customers, and data. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive" asChild>
              <a href="/admin/reset-database">Reset Database</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
