import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params
    const supabase = createSupabaseAdmin()

    console.log(`🔍 Checking webhook status for order: ${orderNumber}`)

    // 1. Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, payment_link_url, payment_link_created_at, created_at")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: "Order not found",
        orderNumber,
      })
    }

    // 2. Check Zapier configuration
    const { data: zapierConfig } = await supabase
      .from("zapier_settings")
      .select("webhook_enabled, webhook_url")
      .single()

    // 3. Check if webhook was queued
    const { data: webhookQueue } = await supabase
      .from("webhook_queue")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // 4. Check webhook debug logs
    const { data: debugLogs } = await supabase
      .from("webhook_debug_logs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // 5. Check order timeline for webhook events
    const { data: timeline } = await supabase
      .from("order_timeline")
      .select("*")
      .eq("order_id", order.id)
      .in("event_type", ["payment_link_created", "webhook_triggered", "webhook_failed"])
      .order("created_at", { ascending: false })

    // 6. Check webhook logs for delivery attempts
    const { data: webhookLogs } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // Analysis
    const analysis = {
      orderExists: true,
      hasPaymentLink: !!order.payment_link_url,
      paymentLinkCreatedAt: order.payment_link_created_at,
      zapierConfigured: !!(zapierConfig?.webhook_enabled && zapierConfig?.webhook_url),
      webhookQueued: (webhookQueue?.length || 0) > 0,
      debugSessionsFound: (debugLogs?.length || 0) > 0,
      timelineEventsFound: (timeline?.length || 0) > 0,
      deliveryAttemptsFound: (webhookLogs?.length || 0) > 0,
    }

    // Determine likely issue
    let diagnosis = "Unknown issue"
    if (!analysis.zapierConfigured) {
      diagnosis = "Zapier webhook not properly configured"
    } else if (!analysis.hasPaymentLink) {
      diagnosis = "Payment link was never created"
    } else if (!analysis.webhookQueued) {
      diagnosis = "Webhook was never queued - likely failed during payment link creation"
    } else if (!analysis.deliveryAttemptsFound) {
      diagnosis = "Webhook was queued but never processed by background job"
    } else {
      const lastLog = webhookLogs?.[0]
      if (lastLog?.status === "failed") {
        diagnosis = `Webhook delivery failed: ${lastLog.error_message || "Unknown error"}`
      } else if (lastLog?.status === "success") {
        diagnosis = "Webhook delivered successfully"
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      analysis,
      diagnosis,
      data: {
        order: {
          id: order.id,
          order_number: order.order_number,
          payment_link_url: order.payment_link_url,
          payment_link_created_at: order.payment_link_created_at,
          created_at: order.created_at,
        },
        zapierConfig: zapierConfig
          ? {
              webhook_enabled: zapierConfig.webhook_enabled,
              webhook_url: zapierConfig.webhook_url ? `${zapierConfig.webhook_url.substring(0, 50)}...` : null,
            }
          : null,
        webhookQueue: webhookQueue || [],
        debugLogs: debugLogs || [],
        timeline: timeline || [],
        webhookLogs: webhookLogs || [],
      },
    })
  } catch (error) {
    console.error("Error checking webhook status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
