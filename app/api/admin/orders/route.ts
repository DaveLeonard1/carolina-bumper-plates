import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Query the correct 'orders' table
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Orders fetch error:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch orders",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Process orders to ensure proper data format
    const processedOrders = (orders || []).map((order) => {
      // Parse order_items if it's a JSON string
      let orderItems = []
      try {
        if (typeof order.order_items === "string") {
          orderItems = JSON.parse(order.order_items)
        } else if (Array.isArray(order.order_items)) {
          orderItems = order.order_items
        }
      } catch (e) {
        console.warn(`Failed to parse order_items for order ${order.order_number}:`, e)
        orderItems = []
      }

      return {
        ...order,
        // Ensure consistent field names
        customer_name: order.customer_name || order.name || "Unknown Customer",
        email: order.customer_email || order.email || "",
        phone: order.customer_phone || order.phone || "",
        subtotal: order.total_amount || order.subtotal || 0,
        order_items: orderItems,
        // Calculate total weight if not present
        total_weight:
          order.total_weight || orderItems.reduce((sum, item) => sum + (item.weight * item.quantity || 0), 0),
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        orders: processedOrders,
        count: processedOrders.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Orders API error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
