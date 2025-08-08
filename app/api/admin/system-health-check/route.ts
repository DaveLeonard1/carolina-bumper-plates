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

    // Test order system health
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    const { data: customers, error: customersError } = await supabaseAdmin
      .from("customers")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(50)

    // Get webhook statistics
    const { data: webhookLogs, error: webhookLogsError } = await supabaseAdmin
      .from("webhook_logs")
      .select("id, success, response_status, response_time_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    const { data: webhookQueue, error: webhookQueueError } = await supabaseAdmin
      .from("webhook_queue")
      .select("id, status, attempts, max_attempts, created_at")
      .order("created_at", { ascending: false })
      .limit(50)

    // Get webhook settings
    const { data: webhookSettings, error: webhookSettingsError } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["zapier_webhook_enabled", "zapier_webhook_url"])

    // Calculate health metrics
    const totalOrders = orders?.length || 0
    const paidOrders = orders?.filter((order) => order.status === "paid").length || 0
    const pendingOrders = orders?.filter((order) => order.status === "pending").length || 0
    const totalRevenue =
      orders?.filter((order) => order.status === "paid").reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    const totalCustomers = customers?.length || 0
    const recentOrders =
      orders?.filter((order) => {
        const orderDate = new Date(order.created_at)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return orderDate > dayAgo
      }).length || 0

    // Calculate webhook metrics
    const totalWebhooks = webhookLogs?.length || 0
    const successfulWebhooks = webhookLogs?.filter((log) => log.success).length || 0
    const failedWebhooks = totalWebhooks - successfulWebhooks
    const avgResponseTime = webhookLogs?.length
      ? Math.round(webhookLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / webhookLogs.length)
      : 0

    const pendingWebhooks = webhookQueue?.filter((item) => item.status === "pending").length || 0
    const failedQueueItems = webhookQueue?.filter((item) => item.status === "failed").length || 0

    const recentWebhooks =
      webhookLogs?.filter((log) => {
        const logDate = new Date(log.created_at)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return logDate > dayAgo
      }).length || 0

    // Get webhook configuration
    const webhookEnabled = webhookSettings?.find((s) => s.key === "zapier_webhook_enabled")?.value === "true"
    const webhookUrl = webhookSettings?.find((s) => s.key === "zapier_webhook_url")?.value || ""

    // Check for potential issues
    const issues = []
    if (dbResponseTime > 1000) {
      issues.push("Database response time is slow (>1s)")
    }
    if (ordersError) {
      issues.push(`Orders table error: ${ordersError.message}`)
    }
    if (customersError) {
      issues.push(`Customers table error: ${customersError.message}`)
    }
    if (webhookLogsError) {
      issues.push(`Webhook logs error: ${webhookLogsError.message}`)
    }
    if (webhookQueueError) {
      issues.push(`Webhook queue error: ${webhookQueueError.message}`)
    }
    if (webhookEnabled && !webhookUrl) {
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
          failedQueue: failedQueueItems,
          recent24h: recentWebhooks,
          avgResponseTime: avgResponseTime,
          enabled: webhookEnabled,
          configured: !!webhookUrl,
          successRate: totalWebhooks > 0 ? Math.round((successfulWebhooks / totalWebhooks) * 100) : 0,
        },
      },
      issues: issues,
      checks: {
        databaseConnectivity: !dbError,
        orderSystemHealth: !ordersError,
        customerSystemHealth: !customersError,
        webhookSystemHealth: !webhookLogsError && !webhookQueueError,
        webhookConfiguration: webhookEnabled ? !!webhookUrl : true,
        webhookDeliveryHealth: totalWebhooks === 0 || failedWebhooks / totalWebhooks < 0.2,
        performanceAcceptable: dbResponseTime < 1000,
      },
      webhookDetails: {
        recentLogs: webhookLogs?.slice(0, 10) || [],
        queueItems: webhookQueue?.slice(0, 10) || [],
        settings: {
          enabled: webhookEnabled,
          url: webhookUrl ? `${webhookUrl.substring(0, 30)}...` : "Not configured",
        },
      },
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
