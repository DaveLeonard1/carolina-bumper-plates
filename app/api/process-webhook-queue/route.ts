import { NextResponse } from "next/server"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

export async function POST() {
  try {
    await zapierWebhook.processWebhookQueue()

    return NextResponse.json({
      success: true,
      message: "Webhook queue processed successfully",
    })
  } catch (error) {
    console.error("Error processing webhook queue:", error)
    return NextResponse.json({ success: false, error: "Failed to process webhook queue" }, { status: 500 })
  }
}
