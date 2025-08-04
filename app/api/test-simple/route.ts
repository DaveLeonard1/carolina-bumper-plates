import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Simple test without any imports
    return NextResponse.json({
      status: "API endpoint working",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: "Simple test failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
