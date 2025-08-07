import { useEffect, useState, useCallback } from 'react'

type OptionType = 'string' | 'number' | 'decimal' | 'boolean' | 'json' | 'email' | 'url' | 'text'

export interface Option {
  id: number
  option_name: string
  option_value: string | null
  option_type: OptionType
  description: string | null
  is_sensitive: boolean
  category: string
  created_at: string
  updated_at: string
}

/**
 * Hook to fetch and manage options from the options table
 * 
 * @param categoryFilter - Optional category to filter options by
 * @param includeCache - Whether to use cached values when available
 * @returns Object with options data and utility functions
 */
export function useOptions(categoryFilter?: string, includeCache: boolean = true) {
  const [options, setOptions] = useState<Record<string, any>>({})
  const [rawOptions, setRawOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to parse option values based on their type
  const parseOptionValue = (value: string | null, type: string): any => {
    if (value === null) return null
    
    switch (type) {
      case 'boolean':
        return value.toLowerCase() === 'true'
      case 'number':
        return parseInt(value, 10)
      case 'decimal':
        return parseFloat(value)
      case 'json':
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      default:
        return value
    }
  }

  // Fetch options based on the category filter
  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      let url = '/api/admin/options'
      if (categoryFilter) {
        url += `/category/${categoryFilter}`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch options: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch options')
      }
      
      setRawOptions(data.options || [])
      
      // Transform options into a key-value object for easy access
      const parsedOptions: Record<string, any> = {}
      data.options.forEach((option: Option) => {
        parsedOptions[option.option_name] = parseOptionValue(option.option_value, option.option_type)
      })
      
      setOptions(parsedOptions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching options:', err)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  // Function to get a single option value with optional default
  const getOption = useCallback((name: string, defaultValue: any = null): any => {
    return options[name] !== undefined ? options[name] : defaultValue
  }, [options])

  // Function to update a single option
  const updateOption = useCallback(async (name: string, value: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/options/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update local state to reflect the change
        setOptions(prev => ({
          ...prev,
          [name]: value
        }))
        return true
      }
      
      return false
    } catch (error) {
      console.error(`Error updating option '${name}':`, error)
      return false
    }
  }, [])

  // Function to update multiple options at once
  const updateOptions = useCallback(async (updates: Record<string, any>): Promise<boolean> => {
    try {
      const optionUpdates = Object.entries(updates).map(([name, value]) => ({
        option_name: name,
        option_value: value
      }))

      const response = await fetch('/api/admin/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: optionUpdates })
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state to reflect the changes
        setOptions(prev => ({
          ...prev,
          ...updates
        }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error updating multiple options:', error)
      return false
    }
  }, [])

  // Fetch options on mount and when category changes
  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  return {
    options,
    rawOptions,
    loading,
    error,
    getOption,
    updateOption,
    updateOptions,
    refreshOptions: fetchOptions
  }
}

/**
 * Hook to fetch and use business settings from the options table
 * 
 * @returns Object with business settings and utility functions
 */
export function useBusinessSettings() {
  const { options, loading, error, updateOption, refreshOptions } = useOptions('business')
  
  // Common business settings with proper typing
  const businessSettings = {
    businessName: options.business_name as string || 'Carolina Bumper Plates',
    businessEmail: options.business_email as string || 'info@carolinabumperplates.com',
    businessPhone: options.business_phone as string || '',
    businessAddress: options.business_address as string || '',
    website: options.website_url as string || 'https://carolinabumperplates.com',
    minimumOrderWeight: options.minimum_order_weight as number || 10000, // in lbs
    taxRate: options.tax_rate as number || 0.0725,
    shippingRate: options.shipping_rate as number || 0.5,
    pickupLocation: options.pickup_location as string || 'Charlotte, NC',
    pickupInstructions: options.pickup_instructions as string || ''
  }
  
  // Update a single business setting
  const updateBusinessSetting = async (name: string, value: any): Promise<boolean> => {
    const optionName = name.replace(/([A-Z])/g, '_$1').toLowerCase()
    return await updateOption(optionName, value)
  }
  
  // Update multiple business settings at once
  const updateBusinessSettings = async (updates: Partial<typeof businessSettings>): Promise<boolean> => {
    // Convert camelCase keys to snake_case for the database
    const optionUpdates: Record<string, any> = {}
    Object.entries(updates).forEach(([key, value]) => {
      const optionName = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      optionUpdates[optionName] = value
    })
    
    // Use the updateOptions function from useOptions
    const { updateOptions } = useOptions()
    return await updateOptions(optionUpdates)
  }
  
  return {
    ...businessSettings,
    loading,
    error,
    updateBusinessSetting,
    updateBusinessSettings,
    refreshBusinessSettings: refreshOptions
  }
}

/**
 * Hook to fetch and use email settings from the options table
 */
export function useEmailSettings() {
  const { options, loading, error, updateOption, refreshOptions } = useOptions('email')
  
  // Email settings
  const emailSettings = {
    emailNotifications: options.email_notifications as boolean || true,
    orderConfirmationEmail: options.order_confirmation_email as boolean || true,
    invoiceEmail: options.invoice_email as boolean || true,
    mailgunApiKey: options.mailgun_api_key as string || '',
    mailgunDomain: options.mailgun_domain as string || '',
    mailgunFromEmail: options.mailgun_from_email as string || ''
  }
  
  // Update a single email setting
  const updateEmailSetting = async (name: string, value: any): Promise<boolean> => {
    const optionName = name.replace(/([A-Z])/g, '_$1').toLowerCase()
    return await updateOption(optionName, value)
  }
  
  return {
    ...emailSettings,
    loading,
    error,
    updateEmailSetting,
    refreshEmailSettings: refreshOptions
  }
}

/**
 * Utility hook for specific pages to access common options
 */
export function useSiteOptions() {
  const businessSettings = useBusinessSettings()
  const emailSettings = useEmailSettings()
  
  return {
    business: businessSettings,
    email: emailSettings
  }
}
