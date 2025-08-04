import { NextResponse } from "next/server"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

export async function GET() {
  try {
    const stats = await zapierWebhook.getWebhookStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Error fetching webhook stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch webhook statistics" }, { status: 500 })
  }
}
