import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params
    console.log(`🔍 Investigating webhook failure for order: ${orderNumber}`)

    const supabase = createSupabaseAdmin()

    // 1. Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        customers (
          id,
          email,
          first_name,
          last_name,
          phone
        )
      `)
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: "Order not found",
        orderNumber,
      })
    }

    // 2. Check webhook settings
    const webhookSettings = await zapierWebhook.getSettings()

    // 3. Check webhook queue for this order
    const { data: queuedWebhooks, error: queueError } = await supabase
      .from("webhook_queue")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // 4. Check webhook logs for this order
    const { data: webhookLogs, error: logsError } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // 5. Check order timeline for webhook events
    const { data: timeline, error: timelineError } = await supabase
      .from("order_timeline")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // 6. Analyze the issue
    const analysis = {
      orderFound: true,
      hasPaymentLink: !!order.payment_link_url,
      paymentLinkCreatedAt: order.payment_link_created_at,
      webhookEnabled: webhookSettings?.webhook_enabled || false,
      webhookUrl: webhookSettings?.webhook_url || null,
      webhookConfigured: !!(webhookSettings?.webhook_enabled && webhookSettings?.webhook_url),
      queuedWebhooksCount: queuedWebhooks?.length || 0,
      webhookLogsCount: webhookLogs?.length || 0,
      timelineEventsCount: timeline?.length || 0,
    }

    // 7. Determine likely issues
    const issues = []
    const recommendations = []

    if (!analysis.webhookConfigured) {
      issues.push("Webhook not properly configured")
      recommendations.push("Enable webhook and set webhook URL in admin settings")
    }

    if (!analysis.hasPaymentLink) {
      issues.push("Order does not have a payment link")
      recommendations.push("Generate payment link for this order first")
    }

    if (analysis.queuedWebhooksCount === 0 && analysis.hasPaymentLink) {
      issues.push("No webhooks were queued for this order")
      recommendations.push("Webhook trigger may have failed during payment link creation")
    }

    if (analysis.queuedWebhooksCount > 0 && analysis.webhookLogsCount === 0) {
      issues.push("Webhooks queued but never processed")
      recommendations.push("Check webhook processing cron job or manually process queue")
    }

    // 8. Check if we can manually trigger webhook
    let manualTriggerResult = null
    if (analysis.hasPaymentLink && analysis.webhookConfigured) {
      try {
        manualTriggerResult = await zapierWebhook.triggerPaymentLinkWebhook(order.id, {
          source: "manual_investigation",
          created_via: "debug_trigger",
        })
      } catch (error) {
        manualTriggerResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
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
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        created_at: order.created_at,
      },
      webhookSettings: {
        enabled: webhookSettings?.webhook_enabled || false,
        url: webhookSettings?.webhook_url || null,
        timeout: webhookSettings?.webhook_timeout || 30,
        retryAttempts: webhookSettings?.webhook_retry_attempts || 3,
      },
      queuedWebhooks: queuedWebhooks || [],
      webhookLogs: webhookLogs || [],
      timeline: timeline || [],
      analysis,
      issues,
      recommendations,
      manualTriggerResult,
    })
  } catch (error) {
    console.error("Error investigating webhook failure:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
