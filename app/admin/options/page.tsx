"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Save, Eye, EyeOff, Plus, Trash2, RefreshCw } from 'lucide-react'
import { colorUsage } from "@/lib/colors"

// Import our custom hooks for options management
import { useOptions, useBusinessSettings, useEmailSettings, useSiteOptions } from "@/hooks/use-options"

interface Option {
  id: number
  option_name: string
  option_value: string | null
  option_type: string
  description: string | null
  is_sensitive: boolean
  category: string
  created_at: string
  updated_at: string
}

export default function AdminOptionsPage() {
  // Use our centralized options hook instead of direct API fetch
  const [activeCategory, setActiveCategory] = useState("business")
  const [showSensitive, setShowSensitive] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Use the useOptions hook with category filter
  const {
    options: optionsData,
    rawOptions,
    loading,
    error,
    updateOption,
    updateOptions,
    refreshOptions
  } = useOptions(activeCategory, true)
  
  // Track edited options separate from the hook's state
  const [editedOptions, setEditedOptions] = useState<Record<string, any>>({})
  
  // Keep editedOptions in sync with optionsData when options change
  useEffect(() => {
    // Initialize edited options with current values
    if (Object.keys(optionsData).length > 0) {
      setEditedOptions(optionsData)
    }
  }, [optionsData])

  const categories = [
    { id: "business", label: "Business", icon: "🏢" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "email", label: "Email", icon: "📧" },
    { id: "stripe", label: "Stripe", icon: "💳" },
    { id: "database", label: "Database", icon: "🗄️" },
    { id: "zapier", label: "Zapier", icon: "⚡" },
    { id: "app", label: "Application", icon: "🚀" },
  ]

  // No need for a separate fetchOptions function as our hook handles this
  
  // Refresh options when showSensitive changes
  useEffect(() => {
    refreshOptions()
  }, [showSensitive, refreshOptions])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Use the updateOptions method from our hook to save all changes at once
      await updateOptions(editedOptions)
      
      // Refresh options to get the updated data
      await refreshOptions()
      
      alert("Options saved successfully!")
    } catch (error) {
      console.error("Failed to save options:", error)
      alert(`Failed to save options: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSaving(false)
    }
  }

  const handleOptionChange = (optionName: string, value: any) => {
    setEditedOptions(prev => ({
      ...prev,
      [optionName]: value
    }))
  }

  const renderOptionInput = (option: Option) => {
    const value = editedOptions[option.option_name] ?? ""
    
    if (option.is_sensitive && !showSensitive) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="password"
            value="••••••••"
            disabled
            className="flex-1"
          />
          <Badge variant="secondary">Hidden</Badge>
        </div>
      )
    }

    switch (option.option_type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => handleOptionChange(option.option_name, checked)}
            />
            <Label>{value ? "Enabled" : "Disabled"}</Label>
          </div>
        )
      
      case "text":
        return (
          <Textarea
            value={value as string}
            onChange={(e) => handleOptionChange(option.option_name, e.target.value)}
            rows={3}
          />
        )
      
      case "number":
      case "decimal":
        return (
          <Input
            type="number"
            step={option.option_type === "decimal" ? "0.0001" : "1"}
            value={value as number}
            onChange={(e) => handleOptionChange(option.option_name, parseFloat(e.target.value) || 0)}
          />
        )
      
      default:
        return (
          <Input
            type={option.option_type === "email" ? "email" : option.option_type === "url" ? "url" : "text"}
            value={value as string}
            onChange={(e) => handleOptionChange(option.option_name, e.target.value)}
          />
        )
    }
  }

  // Filter the rawOptions by the currently active category
  const filteredOptions = rawOptions.filter((option: Option) => option.category === activeCategory)

  // We already have the useEffect for refreshing options when showSensitive changes above,
  // so this duplicate useEffect can be removed.

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
            Configuration Options
          </h1>
          <p style={{ color: colorUsage.textMuted }}>
            Manage application settings and environment variables
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={showSensitive}
              onCheckedChange={setShowSensitive}
            />
            <Label className="flex items-center gap-2">
              {showSensitive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Show Sensitive
            </Label>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-7">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              <span>{category.icon}</span>
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {category.label} Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredOptions.length === 0 ? (
                    <p style={{ color: colorUsage.textMuted }}>
                      No options found for this category.
                    </p>
                  ) : (
                    filteredOptions.map(option => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={option.option_name} className="font-medium">
                              {option.option_name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Label>
                            {option.is_sensitive && (
                              <Badge variant="outline" className="text-xs">
                                Sensitive
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {option.option_type}
                            </Badge>
                          </div>
                          <div className="text-xs" style={{ color: colorUsage.textMuted }}>
                            Updated: {new Date(option.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {renderOptionInput(option)}
                        
                        {option.description && (
                          <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                            {option.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Environment Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Variables Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p style={{ color: colorUsage.textMuted }}>
              These options can also be set via environment variables. Environment variables take precedence over database values.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Stripe</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>STRIPE_PUBLISHABLE_KEY</div>
                  <div>STRIPE_SECRET_KEY</div>
                  <div>STRIPE_WEBHOOK_SECRET</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Mailgun</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>MAILGUN_API_KEY</div>
                  <div>MAILGUN_DOMAIN</div>
                  <div>MAILGUN_FROM_EMAIL</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Supabase</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>NEXT_PUBLIC_SUPABASE_URL</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Application</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>NEXT_PUBLIC_BASE_URL</div>
                  <div>NODE_ENV</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
