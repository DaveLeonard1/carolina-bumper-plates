import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabaseAdmin.from("products").select("count(*)").single()

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection failed",
          details: error.message,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database connection successful",
        productCount: data?.count || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
