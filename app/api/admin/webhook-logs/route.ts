import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createSupabaseAdmin()

    const { data: logs, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching webhook logs:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch webhook logs" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    })
  } catch (error) {
    console.error("Error fetching webhook logs:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch webhook logs" }, { status: 500 })
  }
}
