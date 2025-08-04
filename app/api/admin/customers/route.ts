import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Query the correct 'customers' table (not 'users')
    const { data: customers, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Customers fetch error:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch customers",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Calculate additional stats for each customer
    const customersWithStats = await Promise.all(
      (customers || []).map(async (customer) => {
        // Get order count and total spent for this customer
        const { data: orders, error: ordersError } = await supabaseAdmin
          .from("orders")
          .select("total_amount")
          .eq("customer_email", customer.email)

        const orderCount = orders?.length || 0
        const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        return {
          ...customer,
          order_count: orderCount,
          total_spent: totalSpent,
          // Handle missing columns gracefully
          first_name: customer.first_name || customer.name?.split(" ")[0] || "",
          last_name: customer.last_name || customer.name?.split(" ").slice(1).join(" ") || "",
          phone: customer.phone || customer.customer_phone || "",
          last_sign_in_at: customer.last_sign_in_at || null,
        }
      }),
    )

    return new Response(
      JSON.stringify({
        success: true,
        customers: customersWithStats,
        count: customersWithStats.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Customers API error:", error)
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
