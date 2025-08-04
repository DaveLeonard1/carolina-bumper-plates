import { type NextRequest, NextResponse } from "next/server"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

export async function GET() {
  try {
    const settings = await zapierWebhook.getSettings()

    if (!settings) {
      return NextResponse.json({ success: false, error: "Settings not found" }, { status: 404 })
    }

    // Don't expose the webhook secret in the response
    const { webhook_secret, ...safeSettings } = settings

    return NextResponse.json({
      success: true,
      settings: {
        ...safeSettings,
        has_webhook_secret: !!webhook_secret,
      },
    })
  } catch (error) {
    console.error("Error fetching Zapier settings:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json()

    // Validate webhook URL if provided
    if (updates.webhook_url) {
      try {
        new URL(updates.webhook_url)
      } catch {
        return NextResponse.json({ success: false, error: "Invalid webhook URL format" }, { status: 400 })
      }
    }

    // Validate numeric fields
    if (updates.webhook_timeout && (updates.webhook_timeout < 5 || updates.webhook_timeout > 300)) {
      return NextResponse.json(
        { success: false, error: "Webhook timeout must be between 5 and 300 seconds" },
        { status: 400 },
      )
    }

    if (updates.webhook_retry_attempts && (updates.webhook_retry_attempts < 0 || updates.webhook_retry_attempts > 10)) {
      return NextResponse.json({ success: false, error: "Retry attempts must be between 0 and 10" }, { status: 400 })
    }

    const success = await zapierWebhook.updateSettings(updates)

    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Zapier settings updated successfully",
    })
  } catch (error) {
    console.error("Error updating Zapier settings:", error)
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}
