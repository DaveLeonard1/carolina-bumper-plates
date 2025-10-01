"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface BusinessSettings {
  business_name: string
  business_email: string
  business_phone: string
  business_address: string
  website: string
  minimum_order_weight: number
  tax_rate: number
}

interface BusinessSettingsContextType {
  settings: BusinessSettings
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const DEFAULT_SETTINGS: BusinessSettings = {
  business_name: "The Plate Yard",
  business_email: "info@carolinabumperplates.com",
  business_phone: "(555) 123-4567",
  business_address: "123 Fitness St, Charlotte, NC 28202",
  website: "https://carolinabumperplates.com",
  minimum_order_weight: 10000,
  tax_rate: 0.0725,
}

const BusinessSettingsContext = createContext<BusinessSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  refetch: async () => {},
})

export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/business-settings")
      if (!response.ok) {
        throw new Error("Failed to fetch business settings")
      }

      const data = await response.json()
      if (data.success && data.settings) {
        setSettings(data.settings)
      }
    } catch (err) {
      console.error("Error fetching business settings:", err)
      setError(err instanceof Error ? err.message : "Failed to load settings")
      // Keep default settings on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <BusinessSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refetch: fetchSettings,
      }}
    >
      {children}
    </BusinessSettingsContext.Provider>
  )
}

export function useBusinessSettings() {
  const context = useContext(BusinessSettingsContext)
  if (!context) {
    throw new Error("useBusinessSettings must be used within a BusinessSettingsProvider")
  }
  return context
}
