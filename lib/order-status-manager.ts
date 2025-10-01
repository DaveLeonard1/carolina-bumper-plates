// This file contains functions for managing order status transitions,
// creating payment links, and other order-related operations.

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface CreatePaymentLinkOptions {
  createdVia?: string
  batchId?: string
}

async function createPaymentLinkCore(
  orderId: string,
  amount: number,
  options: CreatePaymentLinkOptions = {},
): Promise<any> {
  // Placeholder implementation for creating a payment link.
  // In a real application, this would involve interacting with a payment gateway like Stripe.

  console.log(`Creating payment link for order ${orderId} with amount ${amount}`)

  // Simulate creating a Stripe Checkout Session
  const session = {
    id: "cs_test_a1i9RTnNmGtV09vjJ1j1j1j1",
    url: "https://example.com/checkout",
  }

  // Simulate updating the order in the database
  try {
    await supabase
      .from("orders")
      .update({
        payment_status: "pending",
        checkout_session_id: session.id,
        order_locked: true,
      })
      .eq("id", orderId)
  } catch (dbError) {
    console.error("Failed to update order:", dbError)
    throw new Error("Failed to update order in database")
  }

  // 11. Add timeline event
  try {
    await supabase.from("order_timeline").insert({
      order_id: orderId,
      event_type: "payment_link_created",
      event_description: "Payment link created - order locked for modifications",
      event_data: {
        checkout_session_id: session.id,
        payment_url: session.url,
        order_locked: true,
        created_via: options.createdVia || "individual",
      },
      created_by: "admin",
    })
  } catch (timelineError) {
    console.error("WARNING: Failed to add timeline event:", timelineError)
  }

  // Webhook removed - add email notification here if needed

  return {
    paymentUrl: session.url,
    checkoutSessionId: session.id,
  }
}

export const orderStatusManager = {
  createPaymentLinkCore,
}
