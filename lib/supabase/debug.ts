import { createClient } from "@supabase/supabase-js"

export async function testSupabaseConnection() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return {
        success: false,
        error: "Missing Supabase environment variables",
        details: {
          url: !!url,
          key: !!key,
        },
      }
    }

    const supabase = createClient(url, key)

    // Test connection
    const { data, error } = await supabase.from("products").select("count", { count: "exact", head: true })

    if (error) {
      return {
        success: false,
        error: "Supabase connection failed",
        details: {
          message: error.message,
          code: error.code,
          hint: error.hint,
        },
      }
    }

    return {
      success: true,
      data: data,
      message: "Supabase connection successful",
    }
  } catch (error) {
    return {
      success: false,
      error: "Connection test failed",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
