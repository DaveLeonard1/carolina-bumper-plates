import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test 1: Check if we can import Supabase
    console.log("Step 1: Testing Supabase import...")
    const { createClient } = await import("@supabase/supabase-js")

    // Test 2: Check environment variables
    console.log("Step 2: Checking environment variables...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl ? "Set" : "Missing",
          key: supabaseKey ? "Set" : "Missing",
        },
        { status: 500 },
      )
    }

    // Test 3: Create client
    console.log("Step 3: Creating Supabase client...")
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 4: Simple query
    console.log("Step 4: Testing simple query...")
    const { data, error } = await supabase.from("products").select("id, title").limit(1)

    if (error) {
      return NextResponse.json(
        {
          step: "Query failed",
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
      productsFound: data?.length || 0,
      sampleProduct: data?.[0] || null,
    })
  } catch (error) {
    console.error("Connection test error:", error)
    return NextResponse.json(
      {
        error: "Connection test failed",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
