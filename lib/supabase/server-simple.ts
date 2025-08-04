export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return {
    url: supabaseUrl,
    serviceKey: supabaseServiceKey,
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
  }
}

export async function createSupabaseClient() {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const config = getSupabaseConfig()

    if (!config.url || !config.serviceKey) {
      throw new Error(`Missing Supabase configuration: url=${!!config.url}, serviceKey=${!!config.serviceKey}`)
    }

    return createClient(config.url, config.serviceKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw error
  }
}
