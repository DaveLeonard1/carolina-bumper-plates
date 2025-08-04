import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Import Supabase
    const { createClient } = await import("@supabase/supabase-js")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Missing Supabase credentials",
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
        },
        { status: 400 },
      )
    }

    // Create client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test query
    const { data, error } = await supabase.from("products").select("count").limit(1)

    return NextResponse.json({
      success: !error,
      error: error?.message || null,
      hasData: !!data,
      dataLength: data?.length || 0,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: "Supabase test failed",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
