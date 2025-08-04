import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseAdmin()

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, order_locked, order_locked_reason, payment_link_url, payment_link_created_at, payment_status",
      )
      .eq("id", orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        order_locked: order.order_locked,
        order_locked_reason: order.order_locked_reason,
        payment_link_url: order.payment_link_url,
        payment_link_created_at: order.payment_link_created_at,
        payment_status: order.payment_status,
        can_modify: !order.order_locked,
        has_payment_link: !!order.payment_link_url,
      },
    })
  } catch (error) {
    console.error("Check order lock status error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check order status",
      },
      { status: 500 },
    )
  }
}
