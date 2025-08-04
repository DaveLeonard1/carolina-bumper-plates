import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      })
    }

    // Try to import and create client
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Simple test query
    const { data, error } = await supabase.from("products").select("count", { count: "exact", head: true })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection working!",
      productsCount: data,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
