import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params
    const { webhookType } = await request.json()

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
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
    if (webhookType === "payment_link") {
      if (!order.payment_link_url) {
        return NextResponse.json({
          success: false,
          error: "Order does not have a payment link",
          message: "Generate a payment link for this order first",
        })
      }
      result = await zapierWebhook.triggerPaymentLinkWebhook(order.id, order.payment_link_url)
    } else if (webhookType === "order_completed") {
      if (order.status !== "paid") {
        return NextResponse.json({
          success: false,
          error: "Order is not marked as paid",
          message: "Order must be paid to trigger completion webhook",
        })
      }
      result = await zapierWebhook.triggerOrderCompletedWebhook(order.id)
    } else {
      return NextResponse.json({
        success: false,
        error: "Invalid webhook type",
        message: "Webhook type must be 'payment_link' or 'order_completed'",
      })
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      webhookType,
      message: `${webhookType} webhook triggered successfully`,
      result,
    })
  } catch (error) {
    console.error("Error manually triggering webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
