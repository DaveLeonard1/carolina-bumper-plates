import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { orderIds, notes, readyDate } = await request.json()

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order IDs are required" },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdmin()
    let confirmedCount = 0

    // Update all orders to "confirmed" status
    for (const orderId of orderIds) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (!updateError) {
        confirmedCount++

        // Add timeline event
        try {
          await supabase.from("order_timeline").insert({
            order_id: orderId,
            event_type: "status_changed",
            event_description: "Order confirmed for vendor batch",
            event_data: {
              new_status: "confirmed",
              vendor_notes: notes || null,
              ready_date: readyDate || null,
            },
            created_by: "admin",
          })
        } catch (timelineError) {
          console.warn("Failed to add timeline event:", timelineError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      confirmedCount,
      message: `Successfully confirmed ${confirmedCount} orders`,
    })
  } catch (error) {
    console.error("Bulk confirm error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while confirming orders" },
      { status: 500 }
    )
  }
}
