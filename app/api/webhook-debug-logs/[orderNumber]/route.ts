import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params
    const supabase = createSupabaseAdmin()

    // Get order ID first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: "Order not found",
        orderNumber,
      })
    }

    // Get all webhook-related logs
    const [queueResult, logsResult, timelineResult, debugLogsResult] = await Promise.all([
      // Webhook queue entries
      supabase
        .from("webhook_queue")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false }),

      // Webhook delivery logs
      supabase
        .from("webhook_logs")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false }),

      // Order timeline events
      supabase
        .from("order_timeline")
        .select("*")
        .eq("order_id", order.id)
        .in("event_type", ["payment_link_created", "manual_webhook_trigger", "webhook_sent", "webhook_failed"])
        .order("created_at", { ascending: false }),

      // Debug logs from webhook processing
      supabase
        .from("webhook_debug_logs")
        .select("*")
        .eq("order_number", orderNumber)
        .order("created_at", { ascending: false }),
    ])

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      logs: {
        webhook_queue: queueResult.data || [],
        webhook_logs: logsResult.data || [],
        timeline_events: timelineResult.data || [],
        debug_logs: debugLogsResult.data || [],
      },
      summary: {
        queued_webhooks: queueResult.data?.length || 0,
        delivered_webhooks: logsResult.data?.filter((log) => log.success).length || 0,
        failed_webhooks: logsResult.data?.filter((log) => !log.success).length || 0,
        timeline_events: timelineResult.data?.length || 0,
        debug_entries: debugLogsResult.data?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching webhook debug logs:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
