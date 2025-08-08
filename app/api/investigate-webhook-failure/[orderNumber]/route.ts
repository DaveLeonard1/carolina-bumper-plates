import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: "Order not found",
        orderNumber,
      })
    }

    // Get webhook settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["zapier_webhook_enabled", "zapier_webhook_url"])

    const webhookEnabled = settings?.find((s) => s.key === "zapier_webhook_enabled")?.value === "true"
    const webhookUrl = settings?.find((s) => s.key === "zapier_webhook_url")?.value || ""

    // Get webhook logs for this order
    const { data: webhookLogs, error: logsError } = await supabaseAdmin
      .from("webhook_logs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // Get webhook queue items for this order
    const { data: queueItems, error: queueError } = await supabaseAdmin
      .from("webhook_queue")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })

    // Analyze issues
    const issues = []
    const recommendations = []

    // Check webhook configuration
    if (!webhookEnabled) {
      issues.push("Webhook automation is disabled")
      recommendations.push("Enable webhook automation in Admin Settings")
    }

    if (webhookEnabled && !webhookUrl) {
      issues.push("Webhook URL is not configured")
      recommendations.push("Add your Zapier webhook URL in Admin Settings")
    }

    // Check order status
    if (!order.payment_link_url) {
      issues.push("Order does not have a payment link")
      recommendations.push("Generate a payment link for this order first")
    }

    // Check webhook delivery
    const hasWebhookLogs = webhookLogs && webhookLogs.length > 0
    const hasQueueItems = queueItems && queueItems.length > 0

    if (webhookEnabled && webhookUrl && order.payment_link_url && !hasWebhookLogs && !hasQueueItems) {
      issues.push("No webhook delivery attempts found")
      recommendations.push("Webhook may not have been triggered - check payment link creation process")
    }

    if (hasQueueItems) {
      const pendingItems = queueItems.filter((item) => item.status === "pending")
      const failedItems = queueItems.filter((item) => item.status === "failed")

      if (pendingItems.length > 0) {
        issues.push(`${pendingItems.length} webhook(s) pending delivery`)
        recommendations.push("Process webhook queue manually or wait for automatic processing")
      }

      if (failedItems.length > 0) {
        issues.push(`${failedItems.length} webhook(s) failed delivery`)
        recommendations.push("Check webhook URL and endpoint configuration")
      }
    }

    if (hasWebhookLogs) {
      const failedLogs = webhookLogs.filter((log) => !log.success)
      if (failedLogs.length > 0) {
        issues.push(`${failedLogs.length} webhook delivery failure(s)`)
        recommendations.push("Check webhook endpoint and review error messages")
      }
    }

    // Determine overall status
    let status = "healthy"
    if (issues.length > 0) {
      status = issues.some((issue) => issue.includes("failed") || issue.includes("error")) ? "error" : "warning"
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      status,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        payment_link_url: order.payment_link_url,
        payment_link_created_at: order.payment_link_created_at,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      webhookConfig: {
        enabled: webhookEnabled,
        url: webhookUrl,
        configured: webhookEnabled && !!webhookUrl,
      },
      webhookActivity: {
        logs: webhookLogs || [],
        queueItems: queueItems || [],
        totalAttempts: (webhookLogs?.length || 0) + (queueItems?.length || 0),
        lastAttempt: webhookLogs?.[0]?.created_at || queueItems?.[0]?.created_at || null,
      },
      analysis: {
        issues,
        recommendations,
        hasPaymentLink: !!order.payment_link_url,
        hasWebhookActivity: hasWebhookLogs || hasQueueItems,
        webhookConfigured: webhookEnabled && !!webhookUrl,
      },
    })
  } catch (error) {
    console.error("Error investigating webhook failure:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to investigate webhook failure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
