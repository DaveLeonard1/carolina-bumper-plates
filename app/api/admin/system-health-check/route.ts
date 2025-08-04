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
      },
      issues: issues,
      checks: {
        databaseConnectivity: !dbError,
        orderSystemHealth: !ordersError,
        customerSystemHealth: !customersError,
        performanceAcceptable: dbResponseTime < 1000,
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
