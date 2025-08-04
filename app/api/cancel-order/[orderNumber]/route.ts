import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    const orderNumber = params.orderNumber
    const { reason } = await request.json()

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Order number is required" }, { status: 400 })
    }

    // Check if we can use Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Order cancellation is temporarily unavailable" },
        { status: 503 },
      )
    }

    const supabase = createSupabaseAdmin()

    // First, check if the order exists and can be cancelled
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.toUpperCase())
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Check if order can be cancelled
    if (existingOrder.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Order cannot be cancelled. Current status: ${existingOrder.status}`,
        },
        { status: 400 },
      )
    }

    if (existingOrder.invoiced_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Order cannot be cancelled as it has already been invoiced",
        },
        { status: 400 },
      )
    }

    // Cancel the order
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: reason || "Cancelled by customer",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", orderNumber.toUpperCase())
      .select()
      .single()

    if (error) {
      console.error("Cancel order error:", error)
      return NextResponse.json({ success: false, error: "Failed to cancel order" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: data,
      message: "Order cancelled successfully",
    })
  } catch (error) {
    console.error("Cancel order error:", error)
    return NextResponse.json({ success: false, error: "An error occurred while cancelling the order" }, { status: 500 })
  }
}
