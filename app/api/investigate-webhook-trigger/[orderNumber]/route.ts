import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params
    const supabase = createSupabaseAdmin()

    console.log(`🔍 Investigating webhook trigger for order: ${orderNumber}`)

    // Step 1: Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
          orderNumber,
        },
        { status: 404 },
      )
    }

    // Step 2: Check payment link creation timeline
    const { data: timeline, error: timelineError } = await supabase
      .from("order_timeline")
      .select("*")
      .eq("order_id", order.id)
      .eq("event_type", "payment_link_created")
      .order("created_at", { ascending: false })

    // Step 3: Check webhook queue entries
    const { data: webhookQueue, error: queueError } = await supabase
      .from("webhook_queue")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // Step 4: Check webhook logs
    const { data: webhookLogs, error: logsError } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // Step 5: Check Zapier settings
    const { data: zapierSettings, error: settingsError } = await supabase.from("zapier_settings").select("*").single()

    // Step 6: Check webhook debug logs
    const { data: debugLogs, error: debugError } = await supabase
      .from("webhook_debug_logs")
      .select("*")
      .or(`order_number.eq.${orderNumber},debug_data.ilike.%${orderNumber}%`)
      .order("created_at", { ascending: false })

    // Analysis
    const analysis = {
      orderFound: !!order,
      hasPaymentLink: !!order.payment_link_url,
      paymentLinkCreatedAt: order.payment_link_created_at,
      orderLocked: order.order_locked,

      // Timeline analysis
      paymentLinkTimelineEvents: timeline?.length || 0,
      lastPaymentLinkEvent: timeline?.[0]?.created_at || null,

      // Webhook queue analysis
      webhookQueueEntries: webhookQueue?.length || 0,
      lastQueueEntry: webhookQueue?.[0] || null,
      queueStatus: webhookQueue?.[0]?.status || "none",

      // Webhook delivery analysis
      webhookDeliveryAttempts: webhookLogs?.length || 0,
      lastDeliveryAttempt: webhookLogs?.[0] || null,
      lastDeliveryStatus: webhookLogs?.[0]?.success || null,

      // Zapier configuration
      zapierEnabled: zapierSettings?.webhook_enabled || false,
      zapierUrl: zapierSettings?.webhook_url || null,
      zapierConfigured: !!(zapierSettings?.webhook_enabled && zapierSettings?.webhook_url),

      // Debug information
      debugLogEntries: debugLogs?.length || 0,
      debugSessions:
        debugLogs?.map((log) => log.debug_session_id).filter((id, index, arr) => arr.indexOf(id) === index) || [],
    }

    // Determine workflow status
    const workflowStatus = {
      step1_orderExists: analysis.orderFound,
      step2_paymentLinkCreated: analysis.hasPaymentLink,
      step3_zapierConfigured: analysis.zapierConfigured,
      step4_webhookQueued: analysis.webhookQueueEntries > 0,
      step5_webhookDelivered: analysis.webhookDeliveryAttempts > 0,
      step6_deliverySuccessful: analysis.lastDeliveryStatus === true,
    }

    // Identify issues
    const issues = []
    const recommendations = []

    if (!analysis.orderFound) {
      issues.push("Order not found in database")
      recommendations.push("Verify order number is correct")
    }

    if (!analysis.hasPaymentLink) {
      issues.push("No payment link created for this order")
      recommendations.push("Create payment link through admin interface")
    }

    if (!analysis.zapierConfigured) {
      issues.push("Zapier webhook not configured")
      recommendations.push("Configure Zapier webhook URL in admin settings")
    }

    if (analysis.hasPaymentLink && analysis.zapierConfigured && analysis.webhookQueueEntries === 0) {
      issues.push("Webhook was not queued despite payment link creation")
      recommendations.push("Check payment link creation process for webhook trigger")
    }

    if (analysis.webhookQueueEntries > 0 && analysis.webhookDeliveryAttempts === 0) {
      issues.push("Webhook queued but never processed")
      recommendations.push("Check webhook queue processing (cron job or manual trigger)")
    }

    if (analysis.webhookDeliveryAttempts > 0 && analysis.lastDeliveryStatus !== true) {
      issues.push("Webhook delivery failed")
      recommendations.push("Check Zapier endpoint URL and network connectivity")
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_link_url: order.payment_link_url,
        payment_link_created_at: order.payment_link_created_at,
        order_locked: order.order_locked,
        created_at: order.created_at,
      },
      analysis,
      workflowStatus,
      issues,
      recommendations,
      rawData: {
        timeline: timeline || [],
        webhookQueue: webhookQueue || [],
        webhookLogs: webhookLogs || [],
        zapierSettings: zapierSettings
          ? {
              webhook_enabled: zapierSettings.webhook_enabled,
              webhook_url: zapierSettings.webhook_url ? zapierSettings.webhook_url.substring(0, 50) + "..." : null,
              webhook_timeout: zapierSettings.webhook_timeout,
              webhook_retry_attempts: zapierSettings.webhook_retry_attempts,
            }
          : null,
        debugLogs: debugLogs || [],
      },
    })
  } catch (error) {
    console.error("Error investigating webhook trigger:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Investigation failed",
      },
      { status: 500 },
    )
  }
}
