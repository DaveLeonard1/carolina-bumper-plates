import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      console.error("Profile GET error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch profile",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile GET unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
