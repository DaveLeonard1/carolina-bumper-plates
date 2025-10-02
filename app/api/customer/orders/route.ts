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

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Customer orders GET error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch orders",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0,
    })
  } catch (error) {
    console.error("Customer orders GET unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
