import { NextResponse } from "next/server"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

export async function GET() {
  try {
    console.log("🔄 Cron job: Processing webhook queue...")

    await zapierWebhook.processWebhookQueue()

    console.log("✅ Cron job: Webhook queue processed successfully")

    return NextResponse.json({
      success: true,
      message: "Webhook queue processed successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Cron job: Error processing webhook queue:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  // Allow manual triggering via POST as well
  return GET()
}
