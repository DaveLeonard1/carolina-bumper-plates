import { createSupabaseAdmin } from '@/lib/supabase'

export interface Option {
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

export interface OptionUpdate {
  option_name: string
  option_value: string | null
}

class OptionsManager {
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get a single option value
   */
  async getOption(name: string, defaultValue: any = null): Promise<any> {
    // Check cache first
    if (this.cache.has(name) && this.cacheExpiry.get(name)! > Date.now()) {
      return this.cache.get(name)
    }

    try {
      const supabase = createSupabaseAdmin()
      const { data, error } = await supabase
        .from('options')
        .select('option_value, option_type')
        .eq('option_name', name)
        .single()

      if (error || !data) {
        console.warn(`Option '${name}' not found, using default value:`, defaultValue)
        return defaultValue
      }

      const value = this.parseOptionValue(data.option_value, data.option_type)
      
      // Cache the result
      this.cache.set(name, value)
      this.cacheExpiry.set(name, Date.now() + this.CACHE_TTL)
      
      return value
    } catch (error) {
      console.error(`Error fetching option '${name}':`, error)
      return defaultValue
    }
  }

  /**
   * Get multiple options by category
   */
  async getOptionsByCategory(category: string): Promise<Record<string, any>> {
    try {
      const supabase = createSupabaseAdmin()
      const { data, error } = await supabase
        .from('options')
        .select('option_name, option_value, option_type')
        .eq('category', category)

      if (error) {
        console.error(`Error fetching options for category '${category}':`, error)
        return {}
      }

      const options: Record<string, any> = {}
      data?.forEach(option => {
        options[option.option_name] = this.parseOptionValue(option.option_value, option.option_type)
      })

      return options
    } catch (error) {
      console.error(`Error fetching options for category '${category}':`, error)
      return {}
    }
  }

  /**
   * Get all options (admin only)
   */
  async getAllOptions(includeSensitive: boolean = false): Promise<Option[]> {
    try {
      const supabase = createSupabaseAdmin()
      let query = supabase.from('options').select('*').order('category, option_name')
      
      if (!includeSensitive) {
        query = query.eq('is_sensitive', false)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching all options:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching all options:', error)
      return []
    }
  }

  /**
   * Set a single option value
   */
  async setOption(name: string, value: any): Promise<boolean> {
    try {
      const supabase = createSupabaseAdmin()
      
      // Convert value to string for storage
      const stringValue = this.stringifyOptionValue(value)
      
      const { error } = await supabase
        .from('options')
        .upsert({
          option_name: name,
          option_value: stringValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'option_name'
        })

      if (error) {
        console.error(`Error setting option '${name}':`, error)
        return false
      }

      // Clear cache for this option
      this.cache.delete(name)
      this.cacheExpiry.delete(name)

      return true
    } catch (error) {
      console.error(`Error setting option '${name}':`, error)
      return false
    }
  }

  /**
   * Set multiple options at once
   */
  async setOptions(options: OptionUpdate[]): Promise<boolean> {
    try {
      const supabase = createSupabaseAdmin()
      
      const updates = options.map(opt => ({
        option_name: opt.option_name,
        option_value: this.stringifyOptionValue(opt.option_value),
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('options')
        .upsert(updates, {
          onConflict: 'option_name'
        })

      if (error) {
        console.error('Error setting multiple options:', error)
        return false
      }

      // Clear cache for updated options
      options.forEach(opt => {
        this.cache.delete(opt.option_name)
        this.cacheExpiry.delete(opt.option_name)
      })

      return true
    } catch (error) {
      console.error('Error setting multiple options:', error)
      return false
    }
  }

  /**
   * Delete an option
   */
  async deleteOption(name: string): Promise<boolean> {
    try {
      const supabase = createSupabaseAdmin()
      const { error } = await supabase
        .from('options')
        .delete()
        .eq('option_name', name)

      if (error) {
        console.error(`Error deleting option '${name}':`, error)
        return false
      }

      // Clear cache
      this.cache.delete(name)
      this.cacheExpiry.delete(name)

      return true
    } catch (error) {
      console.error(`Error deleting option '${name}':`, error)
      return false
    }
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }

  /**
   * Parse option value based on type
   */
  private parseOptionValue(value: string | null, type: string): any {
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

  /**
   * Convert value to string for storage
   */
  private stringifyOptionValue(value: any): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  /**
   * Get environment variable with fallback to options table
   */
  async getEnvOrOption(envKey: string, optionName: string, defaultValue: any = null): Promise<any> {
    // First try environment variable
    const envValue = process.env[envKey]
    if (envValue !== undefined && envValue !== '') {
      return this.parseOptionValue(envValue, 'string')
    }

    // Fallback to options table
    return this.getOption(optionName, defaultValue)
  }
}

// Export singleton instance
export const optionsManager = new OptionsManager()

// Convenience functions
export const getOption = (name: string, defaultValue?: any) => optionsManager.getOption(name, defaultValue)
export const setOption = (name: string, value: any) => optionsManager.setOption(name, value)
export const getOptionsByCategory = (category: string) => optionsManager.getOptionsByCategory(category)
export const getAllOptions = (includeSensitive?: boolean) => optionsManager.getAllOptions(includeSensitive)
export const setOptions = (options: OptionUpdate[]) => optionsManager.setOptions(options)
export const deleteOption = (name: string) => optionsManager.deleteOption(name)
export const clearOptionsCache = () => optionsManager.clearCache()
export const getEnvOrOption = (envKey: string, optionName: string, defaultValue?: any) => 
  optionsManager.getEnvOrOption(envKey, optionName, defaultValue)
