import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params

    // Get order ID
    const { data: order, error: orderError } = await supabaseAdmin
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

    // Get all webhook logs for this order
    const { data: logs, error: logsError } = await supabaseAdmin
      .from("webhook_logs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // Get all webhook queue items for this order
    const { data: queue, error: queueError } = await supabaseAdmin
      .from("webhook_queue")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // Get webhook settings for context
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["zapier_webhook_enabled", "zapier_webhook_url"])

    const webhookEnabled = settings?.find((s) => s.key === "zapier_webhook_enabled")?.value === "true"
    const webhookUrl = settings?.find((s) => s.key === "zapier_webhook_url")?.value || ""

    // Analyze the logs
    const analysis = {
      totalAttempts: (logs?.length || 0) + (queue?.length || 0),
      successfulDeliveries: logs?.filter((log) => log.success).length || 0,
      failedDeliveries: logs?.filter((log) => !log.success).length || 0,
      pendingDeliveries: queue?.filter((item) => item.status === "pending").length || 0,
      lastAttempt: logs?.[0]?.created_at || queue?.[0]?.created_at || null,
      avgResponseTime: logs?.length
        ? Math.round(logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length)
        : 0,
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      webhookConfig: {
        enabled: webhookEnabled,
        url: webhookUrl,
      },
      logs: logs || [],
      queue: queue || [],
      analysis,
    })
  } catch (error) {
    console.error("Error fetching webhook debug logs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch webhook logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
