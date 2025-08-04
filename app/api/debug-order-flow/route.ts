import { createSupabaseAdmin } from "@/lib/supabase"
import { getOrderByNumber } from "@/lib/actions/orders"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get("orderNumber")

  try {
    const supabaseAdmin = createSupabaseAdmin()

    // 1. Check database connection
    const { data: connectionTest, error: connectionError } = await supabaseAdmin.from("orders").select("count").limit(1)

    if (connectionError) {
      return Response.json({
        error: "Database connection failed",
        details: connectionError,
      })
    }

    // 2. Get table structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin.rpc("get_table_info", {
      table_name: "orders",
    })

    // 3. Count total orders
    const { count: totalOrders, error: countError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })

    // 4. Get recent orders
    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_name, customer_email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    // 5. If order number provided, test retrieval
    let orderTest = null
    if (orderNumber) {
      orderTest = await getOrderByNumber(orderNumber)
    }

    return Response.json({
      status: "success",
      database: {
        connected: !connectionError,
        connectionError: connectionError?.message,
      },
      orders: {
        total: totalOrders || 0,
        countError: countError?.message,
        recent: recentOrders || [],
        recentError: recentError?.message,
      },
      orderTest: orderNumber
        ? {
            orderNumber,
            found: !!orderTest,
            data: orderTest,
          }
        : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return Response.json({
      error: "Debug API failed",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}
