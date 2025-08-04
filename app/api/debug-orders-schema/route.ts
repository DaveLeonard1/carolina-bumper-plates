import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createSupabaseAdmin()

    console.log("🔍 Debugging orders table schema...")

    // First, let's see what columns actually exist in the orders table
    const { data: orders, error: ordersError } = await supabase.from("orders").select("*").limit(1)

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json({
        success: false,
        error: "Failed to fetch orders",
        details: ordersError.message,
      })
    }

    // Get the actual column names from the first order
    const actualColumns = orders && orders.length > 0 ? Object.keys(orders[0]) : []

    console.log("Actual columns in orders table:", actualColumns)

    // Let's also check a few sample orders to see the data structure
    const { data: sampleOrders, error: sampleError } = await supabase.from("orders").select("*").limit(3)

    if (sampleError) {
      console.error("Error fetching sample orders:", sampleError)
    }

    return NextResponse.json({
      success: true,
      actualColumns,
      sampleOrders: sampleOrders || [],
      message: "Orders schema debugged successfully",
    })
  } catch (error) {
    console.error("Schema debug failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Schema debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
