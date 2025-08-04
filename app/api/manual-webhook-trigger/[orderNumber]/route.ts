import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

export async function POST(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params
    const { event_type = "payment_link_created" } = await request.json()

    console.log(`🔧 Manual webhook trigger for order: ${orderNumber}, event: ${event_type}`)

    const supabase = createSupabaseAdmin()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: "Order not found",
        orderNumber,
      })
    }

    let result

    if (event_type === "payment_link_created") {
      if (!order.payment_link_url) {
        return NextResponse.json({
          success: false,
          error: "Order does not have a payment link",
          orderNumber,
        })
      }

      result = await zapierWebhook.triggerPaymentLinkWebhook(order.id, {
        source: "manual_trigger",
        created_via: "admin_debug",
      })
    } else if (event_type === "order_completed") {
      if (order.payment_status !== "paid") {
        return NextResponse.json({
          success: false,
          error: "Order is not marked as paid",
          orderNumber,
        })
      }

      result = await zapierWebhook.triggerOrderCompletedWebhook(
        order.id,
        {
          method: "manual_trigger",
          amount_paid: order.total_amount || 0,
          paid_at: order.paid_at || new Date().toISOString(),
        },
        {
          source: "manual_trigger",
          trigger: "admin_debug",
        },
      )
    } else {
      return NextResponse.json({
        success: false,
        error: "Invalid event type. Use 'payment_link_created' or 'order_completed'",
      })
    }

    // Add timeline event
    try {
      await supabase.from("order_timeline").insert({
        order_id: order.id,
        event_type: "manual_webhook_trigger",
        event_description: `Manual webhook trigger for ${event_type}`,
        event_data: {
          event_type,
          trigger_result: result,
          triggered_by: "admin",
        },
        created_by: "admin",
        created_at: new Date().toISOString(),
      })
    } catch (timelineError) {
      console.warn("Failed to add timeline event:", timelineError)
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      event_type,
      webhook_result: result,
      message: result.success ? "Webhook triggered successfully" : "Webhook trigger failed",
    })
  } catch (error) {
    console.error("Error manually triggering webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
