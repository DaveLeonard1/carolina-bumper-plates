import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("🧪 Testing payment flow...")

    const supabase = createSupabaseAdmin()
    const stripe = await getStripe()

    // 1. Create a test order
    const testOrder = {
      order_number: `TEST-${Date.now()}`,
      customer_name: "Test Customer",
      customer_email: "test@example.com",
      customer_phone: "555-0123",
      shipping_address: "123 Test St",
      shipping_city: "Test City",
      shipping_state: "NC",
      shipping_zip: "12345",
      order_items: JSON.stringify([{ weight: 45, quantity: 2, price: 150 }]),
      total_amount: 300,
      status: "pending",
      payment_status: null,
      created_at: new Date().toISOString(),
    }

    const { data: order, error: orderError } = await supabase.from("orders").insert(testOrder).select().single()

    if (orderError) {
      throw new Error(`Failed to create test order: ${orderError.message}`)
    }

    console.log(`✅ Created test order: ${order.order_number}`)

    // 2. Create a Stripe checkout session (test mode)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Test Bumper Plates",
              description: "45lb x 2 = 90lb total",
            },
            unit_amount: 30000, // $300.00 in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_number: order.order_number,
        order_id: order.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout`,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    })

    // 3. Update order with checkout session
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        payment_link_url: session.url,
        payment_status: "pending",
        order_locked: true,
      })
      .eq("id", order.id)

    if (updateError) {
      throw new Error(`Failed to update order with session: ${updateError.message}`)
    }

    console.log(`✅ Created Stripe session: ${session.id}`)

    // 4. Add timeline event
    await supabase.from("order_timeline").insert({
      order_id: order.id,
      event_type: "test_payment_link_created",
      event_description: "Test payment link created for integration testing",
      event_data: {
        checkout_session_id: session.id,
        payment_url: session.url,
        test_mode: true,
      },
      created_by: "system_test",
    })

    // 5. Test webhook endpoint accessibility
    const webhookTest = {
      accessible: false,
      error: null as string | null,
    }

    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/stripe/webhook`
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      })

      // We expect this to fail with signature verification, but it should be accessible
      webhookTest.accessible = response.status === 400 // Bad signature is expected
    } catch (error) {
      webhookTest.error = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json({
      success: true,
      test_results: {
        order_created: {
          success: true,
          order_id: order.id,
          order_number: order.order_number,
        },
        stripe_session: {
          success: true,
          session_id: session.id,
          payment_url: session.url,
        },
        database_updates: {
          success: !updateError,
          error: updateError?.message || null,
        },
        webhook_endpoint: webhookTest,
        next_steps: [
          "Visit the payment URL to complete test payment",
          "Check webhook logs for payment completion",
          "Verify order status updates to 'paid'",
          "Clean up test order when done",
        ],
      },
      test_payment_url: session.url,
      cleanup_order_id: order.id,
    })
  } catch (error) {
    console.error("🚨 Payment flow test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
