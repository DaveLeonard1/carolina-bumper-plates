import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Test database connectivity
    const dbStart = Date.now()
    const { data: dbTest, error: dbError } = await supabaseAdmin.from("orders").select("count").limit(1)
    const dbResponseTime = Date.now() - dbStart

    if (dbError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: dbError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Get system data
    const [ordersResult, customersResult, webhookLogsResult, webhookQueueResult, zapierSettingsResult] =
      await Promise.allSettled([
        supabaseAdmin
          .from("orders")
          .select("id, status, total_amount, created_at, payment_status")
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin.from("customers").select("id, created_at").order("created_at", { ascending: false }).limit(50),
        supabaseAdmin
          .from("webhook_logs")
          .select("id, order_id, success, response_status, response_time_ms, created_at, error_message, retry_count")
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseAdmin
          .from("webhook_queue")
          .select("id, order_id, status, attempts, max_attempts, created_at, error_message")
          .order("created_at", { ascending: false })
          .limit(25),
        supabaseAdmin.from("zapier_settings").select("*").single(),
      ])

    // Extract data from settled promises
    const orders = ordersResult.status === "fulfilled" ? ordersResult.value.data || [] : []
    const customers = customersResult.status === "fulfilled" ? customersResult.value.data || [] : []
    const webhookLogs = webhookLogsResult.status === "fulfilled" ? webhookLogsResult.value.data || [] : []
    const webhookQueue = webhookQueueResult.status === "fulfilled" ? webhookQueueResult.value.data || [] : []
    const zapierSettings = zapierSettingsResult.status === "fulfilled" ? zapierSettingsResult.value.data : null

    // Calculate system metrics
    const totalOrders = orders.length
    const paidOrders = orders.filter((order) => order.status === "paid").length
    const pendingOrders = orders.filter((order) => order.status === "pending").length
    const totalRevenue = orders
      .filter((order) => order.status === "paid")
      .reduce((sum, order) => sum + (order.total_amount || 0), 0)

    const totalCustomers = customers.length
    const recentOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return orderDate > dayAgo
    }).length

    // Calculate webhook metrics
    const totalWebhooks = webhookLogs.length
    const successfulWebhooks = webhookLogs.filter((log) => log.success).length
    const failedWebhooks = totalWebhooks - successfulWebhooks
    const avgResponseTime = webhookLogs.length
      ? Math.round(webhookLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / webhookLogs.length)
      : 0

    const pendingWebhooks = webhookQueue.filter((item) => item.status === "pending").length
    const failedQueueItems = webhookQueue.filter((item) => item.status === "failed").length
    const processingWebhooks = webhookQueue.filter((item) => item.status === "processing").length

    const recentWebhooks = webhookLogs.filter((log) => {
      const logDate = new Date(log.created_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logDate > dayAgo
    }).length

    // Webhook configuration
    const webhookEnabled = zapierSettings?.webhook_enabled || false
    const webhookUrl = zapierSettings?.webhook_url || ""
    const webhookConfigured = !!webhookUrl

    // Check for issues
    const issues = []
    if (dbResponseTime > 1000) {
      issues.push("Database response time is slow (>1s)")
    }
    if (ordersResult.status === "rejected") {
      issues.push("Failed to fetch orders data")
    }
    if (customersResult.status === "rejected") {
      issues.push("Failed to fetch customers data")
    }
    if (webhookLogsResult.status === "rejected") {
      issues.push("Failed to fetch webhook logs")
    }
    if (webhookQueueResult.status === "rejected") {
      issues.push("Failed to fetch webhook queue")
    }
    if (webhookEnabled && !webhookConfigured) {
      issues.push("Webhook enabled but no URL configured")
    }
    if (pendingWebhooks > 10) {
      issues.push(`High number of pending webhooks (${pendingWebhooks})`)
    }
    if (failedQueueItems > 5) {
      issues.push(`Multiple failed webhook deliveries (${failedQueueItems})`)
    }
    if (totalWebhooks > 0 && failedWebhooks / totalWebhooks > 0.2) {
      issues.push(`High webhook failure rate (${Math.round((failedWebhooks / totalWebhooks) * 100)}%)`)
    }

    const totalResponseTime = Date.now() - startTime

    return NextResponse.json({
      status: issues.length > 0 ? "warning" : "healthy",
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      metrics: {
        database: {
          status: dbError ? "error" : "healthy",
          responseTime: dbResponseTime,
        },
        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
          recent24h: recentOrders,
        },
        revenue: {
          total: totalRevenue,
          formatted: `$${totalRevenue.toFixed(2)}`,
        },
        customers: {
          total: totalCustomers,
        },
        webhooks: {
          total: totalWebhooks,
          successful: successfulWebhooks,
          failed: failedWebhooks,
          pending: pendingWebhooks,
          processing: processingWebhooks,
          failedQueue: failedQueueItems,
          recent24h: recentWebhooks,
          avgResponseTime: avgResponseTime,
          enabled: webhookEnabled,
          configured: webhookConfigured,
          successRate: totalWebhooks > 0 ? Math.round((successfulWebhooks / totalWebhooks) * 100) : 0,
        },
      },
      issues: issues,
      checks: {
        databaseConnectivity: !dbError,
        orderSystemHealth: ordersResult.status === "fulfilled",
        customerSystemHealth: customersResult.status === "fulfilled",
        webhookSystemHealth: webhookLogsResult.status === "fulfilled" && webhookQueueResult.status === "fulfilled",
        webhookConfiguration: webhookEnabled ? webhookConfigured : true,
        webhookDeliveryHealth: totalWebhooks === 0 || failedWebhooks / totalWebhooks < 0.2,
        performanceAcceptable: dbResponseTime < 1000,
      },
      webhookDetails: {
        recentLogs: webhookLogs.slice(0, 10),
        queueItems: webhookQueue.slice(0, 10),
        settings: zapierSettings
          ? {
              ...zapierSettings,
              webhook_secret: zapierSettings.webhook_secret ? "***configured***" : null,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Unified dashboard data fetch failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Dashboard data fetch failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
