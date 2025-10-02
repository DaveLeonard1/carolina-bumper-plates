import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripe } from "@/lib/stripe"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")
    const orderId = searchParams.get("order_id")

    if (!sessionId || !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing session ID or order ID",
        },
        { status: 400 },
      )
    }

    const supabase = createSupabaseAdmin()
    const stripe = await getStripe()

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid checkout session",
        },
        { status: 404 },
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      )
    }

    // Update order status if payment was successful
    if (session.payment_status === "paid" && order.payment_status !== "paid") {
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      // Add timeline event
      await supabase.from("order_timeline").insert({
        order_id: orderId,
        event_type: "payment_completed",
        event_description: "Payment completed successfully via Stripe Checkout",
        event_data: {
          checkout_session_id: sessionId,
          payment_intent_id: session.payment_intent,
          amount_paid: session.amount_total,
        },
        created_by: "system",
      })
    }

    return NextResponse.json({
      success: true,
      details: {
        sessionId: session.id,
        orderId: order.id,
        orderNumber: order.order_number,
        customerEmail: session.customer_details?.email || order.customer_email,
        amountPaid: session.amount_total || 0,
        paymentStatus: session.payment_status,
      },
    })
  } catch (error) {
    console.error("Payment success verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify payment",
      },
      { status: 500 },
    )
  }
}
