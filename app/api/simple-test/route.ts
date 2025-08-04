import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      message: "API is working!",
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Simple test failed",
        message: String(error),
      },
      { status: 500 },
    )
  }
}
