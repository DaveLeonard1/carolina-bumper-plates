import { type NextRequest, NextResponse } from "next/server"
import { webhookDebugger } from "@/lib/zapier-webhook-debug"

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    console.log(`🔍 Starting webhook failure diagnosis for order ${orderId}`)

    const diagnosticResult = await webhookDebugger.diagnoseWebhookFailure(orderId)

    console.log(`✅ Webhook diagnosis completed for order ${orderId}:`, {
      success: diagnosticResult.success,
      failedSteps: diagnosticResult.failedSteps,
      sessionId: diagnosticResult.sessionId,
    })

    return NextResponse.json({
      success: true,
      diagnostic: diagnosticResult,
      message: diagnosticResult.success
        ? "Webhook diagnosis completed successfully - no issues found"
        : `Webhook diagnosis found ${diagnosticResult.failedSteps} issues`,
    })
  } catch (error) {
    console.error("Error in webhook failure diagnosis:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to diagnose webhook failure",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Get debug history for this order
    const debugHistory = await webhookDebugger.getDebugHistory(orderId)

    return NextResponse.json({
      success: true,
      orderId,
      debugHistory,
      message: `Found ${debugHistory.length} debug sessions for order ${orderId}`,
    })
  } catch (error) {
    console.error("Error fetching webhook debug history:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch debug history",
      },
      { status: 500 },
    )
  }
}
