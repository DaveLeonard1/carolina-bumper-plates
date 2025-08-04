import { createSupabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔄 Fetching dashboard metrics...")
    const supabaseAdmin = createSupabaseAdmin()

    // Get all orders with detailed logging
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total_amount, subtotal, status, created_at, customer_email, paid_at")
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("❌ Orders fetch error:", ordersError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch orders",
          details: ordersError.message,
        },
        { status: 500 },
      )
    }

    console.log(`📊 Found ${orders?.length || 0} total orders`)
    console.log(
      "📋 Orders data:",
      orders?.map((o) => ({
        order_number: o.order_number,
        status: o.status,
        total_amount: o.total_amount,
        subtotal: o.subtotal,
      })),
    )

    // Get all customers
    const { data: customers, error: customersError } = await supabaseAdmin
      .from("customers")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })

    if (customersError) {
      console.error("❌ Customers fetch error:", customersError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch customers",
          details: customersError.message,
        },
        { status: 500 },
      )
    }

    console.log(`👥 Found ${customers?.length || 0} total customers`)

    // Calculate metrics with detailed logging
    const totalOrders = orders?.length || 0
    const totalCustomers = customers?.length || 0

    const paidOrders = orders?.filter((order) => order.status === "paid") || []
    const pendingOrders = orders?.filter((order) => order.status === "pending") || []

    console.log(`💰 Paid orders: ${paidOrders.length}`)
    console.log(`⏳ Pending orders: ${pendingOrders.length}`)

    // Calculate revenue using both total_amount and subtotal as fallback
    const totalRevenue = paidOrders.reduce((sum, order) => {
      const amount = order.total_amount || order.subtotal || 0
      console.log(
        `💵 Order ${order.order_number}: $${amount} (total_amount: ${order.total_amount}, subtotal: ${order.subtotal})`,
      )
      return sum + amount
    }, 0)

    console.log(`💰 Total revenue calculated: $${totalRevenue}`)

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentOrders = orders?.filter((order) => new Date(order.created_at) >= sevenDaysAgo)?.length || 0
    const recentCustomers = customers?.filter((customer) => new Date(customer.created_at) >= sevenDaysAgo)?.length || 0

    // Calculate daily revenue for the last 30 days for chart
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyRevenue = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayOrders = orders?.filter((order) => order.status === "paid" && order.created_at.startsWith(dateStr)) || []

      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total_amount || order.subtotal || 0), 0)

      dailyRevenue.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length,
      })
    }

    // Get recent activity for timeline
    const recentActivity = []

    // Add recent orders (last 10)
    const latestOrders = orders?.slice(0, 10) || []
    latestOrders.forEach((order) => {
      const amount = order.total_amount || order.subtotal || 0
      recentActivity.push({
        id: `order-${order.id}`,
        type: "order",
        title: `Order ${order.order_number}`,
        description: `${order.customer_email} - $${amount.toFixed(2)}`,
        timestamp: order.created_at,
        status: order.status,
      })
    })

    // Add recent customers (last 5)
    const latestCustomers = customers?.slice(0, 5) || []
    latestCustomers.forEach((customer) => {
      recentActivity.push({
        id: `customer-${customer.id}`,
        type: "customer",
        title: "New customer registered",
        description: customer.email,
        timestamp: customer.created_at,
        status: "active",
      })
    })

    // Sort by timestamp (most recent first)
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const responseData = {
      success: true,
      metrics: {
        totalOrders,
        totalCustomers,
        pendingOrders: pendingOrders.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        recentOrders,
        recentCustomers,
      },
      charts: {
        dailyRevenue,
      },
      recentActivity: recentActivity.slice(0, 15),
      lastUpdated: new Date().toISOString(),
      debug: {
        ordersCount: orders?.length || 0,
        paidOrdersCount: paidOrders.length,
        sampleOrder: orders?.[0]
          ? {
              order_number: orders[0].order_number,
              status: orders[0].status,
              total_amount: orders[0].total_amount,
              subtotal: orders[0].subtotal,
            }
          : null,
      },
    }

    console.log("✅ Dashboard metrics response:", responseData.metrics)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ Dashboard metrics error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
