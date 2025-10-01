import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { orderId, status, notes } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Order ID and status are required" },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdmin()

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to update order status:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update order status" },
        { status: 500 }
      )
    }

    // Add timeline event
    try {
      await supabase.from("order_timeline").insert({
        order_id: orderId,
        event_type: "status_changed",
        event_description: `Order status changed to ${status}`,
        event_data: {
          new_status: status,
          notes: notes || null,
        },
        created_by: "admin",
      })
    } catch (timelineError) {
      console.warn("Failed to add timeline event:", timelineError)
    }

    return NextResponse.json({
      success: true,
      order,
      message: `Order status updated to ${status}`,
    })
  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while updating the order status" },
      { status: 500 }
    )
  }
}
