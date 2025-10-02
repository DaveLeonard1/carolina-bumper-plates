import { createClient } from "@supabase/supabase-js"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validation for required variables
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Client-side Supabase client (for browser) - always available
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client factory - creates client when needed
export function createSupabaseAdmin() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Database types
export interface Product {
  id: number
  title: string
  weight: number
  selling_price: number
  regular_price: number
  description: string | null
  available: boolean
  created_at: string
  updated_at: string
  image_url?: string
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  first_name: string | null
  last_name: string | null
  total_amount: number
  total_weight: number
  status: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}
