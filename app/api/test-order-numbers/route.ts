import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  console.log("🧪 Testing simplified order number system...")

  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Test creating a few orders to see the new order numbers
    const testOrders = [
      {
        customer_name: "Test Customer 1",
        customer_email: "test1@example.com",
        customer_phone: "555-0001",
        street_address: "123 Test St",
        city: "Test City",
        state: "TS",
        zip_code: "12345",
        order_items: [{ productId: "test", quantity: 1, price: 100 }],
        subtotal: 100,
        total_weight: 45,
        status: "pending",
        first_name: "Test",
        last_name: "Customer 1",
      },
      {
        customer_name: "Test Customer 2",
        customer_email: "test2@example.com",
        customer_phone: "555-0002",
        street_address: "456 Test Ave",
        city: "Test City",
        state: "TS",
        zip_code: "12345",
        order_items: [{ productId: "test", quantity: 2, price: 200 }],
        subtotal: 200,
        total_weight: 90,
        status: "pending",
        first_name: "Test",
        last_name: "Customer 2",
      },
    ]

    const results = []

    for (const orderData of testOrders) {
      console.log("📝 Creating test order...")

      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .insert(orderData)
        .select("order_number, customer_name, created_at")
        .single()

      if (error) {
        console.error("❌ Error creating test order:", error)
        results.push({ error: error.message })
      } else {
        console.log("✅ Created order:", order.order_number)
        results.push({
          order_number: order.order_number,
          customer_name: order.customer_name,
          created_at: order.created_at,
        })
      }
    }

    // Get recent orders to show the new format
    const { data: recentOrders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    if (fetchError) {
      console.error("❌ Error fetching recent orders:", fetchError)
    }

    return Response.json({
      success: true,
      message: "Order number system test completed",
      testResults: results,
      recentOrders: recentOrders || [],
      orderNumberFormat: {
        prefix: "CBP-",
        digits: 4,
        examples: ["CBP-1000", "CBP-1001", "CBP-1234"],
        description: "Carolina Bumper Plates + 4-digit sequential number",
      },
    })
  } catch (error) {
    console.error("💥 Test error:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
