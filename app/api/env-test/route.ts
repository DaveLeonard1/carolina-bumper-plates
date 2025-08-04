export async function GET() {
  try {
    const envVars = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    }

    return Response.json({
      success: true,
      message: "Environment check complete",
      environment: envVars,
    })
  } catch (error) {
    console.error("Env test error:", error)
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
