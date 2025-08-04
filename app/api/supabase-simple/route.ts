export async function GET() {
  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return Response.json({
        success: false,
        error: "NEXT_PUBLIC_SUPABASE_URL is not set",
      })
    }

    if (!supabaseKey) {
      return Response.json({
        success: false,
        error: "SUPABASE_SERVICE_ROLE_KEY is not set",
      })
    }

    // Try to import Supabase
    let createClient
    try {
      const supabaseModule = await import("@supabase/supabase-js")
      createClient = supabaseModule.createClient
    } catch (importError) {
      return Response.json({
        success: false,
        error: "Failed to import Supabase",
        details: String(importError),
      })
    }

    // Try to create client
    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseKey)
    } catch (clientError) {
      return Response.json({
        success: false,
        error: "Failed to create Supabase client",
        details: String(clientError),
      })
    }

    // Try a simple query
    try {
      const { data, error } = await supabase.from("products").select("id").limit(1)

      if (error) {
        return Response.json({
          success: false,
          error: "Database query failed",
          details: error.message,
          code: error.code,
        })
      }

      return Response.json({
        success: true,
        message: "Supabase connection successful!",
        hasData: !!data && data.length > 0,
      })
    } catch (queryError) {
      return Response.json({
        success: false,
        error: "Query execution failed",
        details: String(queryError),
      })
    }
  } catch (error) {
    console.error("Supabase simple test error:", error)
    return Response.json(
      {
        success: false,
        error: "Unexpected error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
