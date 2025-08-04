import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createSupabaseAdmin()

    const { data: queue, error } = await supabase
      .from("webhook_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching webhook queue:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch webhook queue" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      queue: queue || [],
    })
  } catch (error) {
    console.error("Error fetching webhook queue:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch webhook queue" }, { status: 500 })
  }
}
