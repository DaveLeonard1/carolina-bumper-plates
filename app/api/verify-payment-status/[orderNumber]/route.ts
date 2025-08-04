import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripe } from "@/lib/stripe"

export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const { orderNumber } = params
    console.log(`🔍 Verifying payment status for order: ${orderNumber}`)

    const supabaseAdmin = createSupabaseAdmin()

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      console.error(`❌ Order not found: ${orderNumber}`)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // If already marked as paid, return current status
    if (order.payment_status === "paid") {
      console.log(`✅ Order ${orderNumber} already marked as paid`)
      return NextResponse.json({
        success: true,
        order_number: orderNumber,
        payment_status: "paid",
        paid_at: order.paid_at,
        already_paid: true,
      })
    }

    // Check Stripe for payment status if we have a checkout session
    if (order.stripe_checkout_session_id) {
      try {
        const stripe = await getStripe()
        const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id)

        console.log(`🔍 Stripe session status: ${session.payment_status}`)

        if (session.payment_status === "paid") {
          console.log(`💳 Payment confirmed in Stripe for order ${orderNumber}`)

          // Update order status
          const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "paid",
              status: "paid",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id)

          if (updateError) {
            console.error(`❌ Failed to update order ${orderNumber}:`, updateError)
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
          }

          // Add timeline event
          await supabaseAdmin.from("order_timeline").insert({
            order_id: order.id,
            event_type: "payment_verified",
            event_description: "Payment status verified and confirmed via API check",
            event_data: {
              checkout_session_id: session.id,
              payment_intent_id: session.payment_intent,
              verified_at: new Date().toISOString(),
            },
            created_by: "payment_verification",
            created_at: new Date().toISOString(),
          })

          console.log(`✅ Order ${orderNumber} updated to paid status`)

          return NextResponse.json({
            success: true,
            order_number: orderNumber,
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            verified_from_stripe: true,
          })
        }
      } catch (stripeError) {
        console.error(`❌ Error checking Stripe session:`, stripeError)
      }
    }

    // Return current status if not paid
    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      payment_status: order.payment_status || "pending",
      paid_at: order.paid_at,
      needs_payment: !!order.payment_link_url && order.payment_status !== "paid",
    })
  } catch (error) {
    console.error("🚨 Error verifying payment status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
