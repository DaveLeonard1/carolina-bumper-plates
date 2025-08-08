import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getStripe } from "@/lib/stripe"
import { createSupabaseAdmin } from "@/lib/supabase"
import { zapierWebhook } from "@/lib/zapier-webhook-core"
import type Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Enhanced logging function
async function logWebhookEvent(
  supabaseAdmin: any,
  eventType: string,
  eventId: string,
  orderNumber: string | null,
  status: "success" | "error" | "warning",
  message: string,
  data?: any,
) {
  try {
    await supabaseAdmin.from("webhook_debug_logs").insert({
      event_type: eventType,
      event_id: eventId,
      order_number: orderNumber,
      status,
      message,
      debug_data: data ? JSON.stringify(data) : null,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to log webhook event:", error)
  }
}

// Enhanced order lookup with multiple fallback methods
async function findOrderByPayment(supabaseAdmin: any, session: Stripe.Checkout.Session) {
  let order = null
  let lookupMethod = "unknown"

  // Method 1: Look up by order_number in metadata (primary)
  if (session.metadata?.order_number) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_number", session.metadata.order_number)
      .single()

    if (!error && data) {
      order = data
      lookupMethod = "metadata_order_number"
    }
  }

  // Method 2: Look up by customer email (fallback)
  if (!order && session.customer_details?.email) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("customer_email", session.customer_details.email.toLowerCase())
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!error && data) {
      order = data
      lookupMethod = "customer_email_recent"
    }
  }

  // Method 3: Look up by existing Stripe session ID (duplicate webhook protection)
  if (!order) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("stripe_checkout_session_id", session.id)
      .single()

    if (!error && data) {
      order = data
      lookupMethod = "existing_session_id"
    }
  }

  return { order, lookupMethod }
}

// Retry mechanism for database updates
async function updateOrderWithRetry(supabaseAdmin: any, orderId: number, updateData: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { error } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId)

    if (!error) {
      return { success: true, attempt }
    }

    if (attempt === maxRetries) {
      return { success: false, error, attempt }
    }

    // Wait before retry (exponential backoff)
    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
  }
}

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("No Stripe signature found")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    const stripe = await getStripe()
    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      await logWebhookEvent(
        supabaseAdmin,
        "signature_verification_failed",
        "unknown",
        null,
        "error",
        `Signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        { signature: signature?.substring(0, 20) + "..." },
      )
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log(`🔔 Received webhook event: ${event.type} (${event.id})`)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`💳 Checkout session completed: ${session.id}`)

        await logWebhookEvent(
          supabaseAdmin,
          "checkout.session.completed",
          event.id,
          session.metadata?.order_number || null,
          "success",
          `Processing checkout session: ${session.id}`,
          {
            session_id: session.id,
            customer_email: session.customer_details?.email,
            amount_total: session.amount_total,
            metadata: session.metadata,
          },
        )

        // Handle payment link completion
        if (session.mode === "payment") {
          // Enhanced order lookup
          const { order, lookupMethod } = await findOrderByPayment(supabaseAdmin, session)

          if (!order) {
            const errorMessage = `Order not found for payment session ${session.id}`
            console.error(`❌ ${errorMessage}`)

            await logWebhookEvent(
              supabaseAdmin,
              "checkout.session.completed",
              event.id,
              session.metadata?.order_number || null,
              "error",
              errorMessage,
              {
                session_id: session.id,
                customer_email: session.customer_details?.email,
                metadata: session.metadata,
                lookup_attempts: ["metadata_order_number", "customer_email_recent", "existing_session_id"],
              },
            )

            // Return 200 to prevent Stripe retries, but log the failure
            return NextResponse.json({
              received: true,
              error: "Order not found",
              session_id: session.id,
            })
          }

          console.log(`✅ Found order via ${lookupMethod}: ${order.id} - ${order.customer_name}`)

          // Check if already processed (duplicate webhook protection)
          if (order.payment_status === "paid" && order.stripe_checkout_session_id === session.id) {
            console.log(`⚠️ Order ${order.order_number} already processed for session ${session.id}`)

            await logWebhookEvent(
              supabaseAdmin,
              "checkout.session.completed",
              event.id,
              order.order_number,
              "warning",
              "Duplicate webhook - order already processed",
              { session_id: session.id, order_id: order.id },
            )

            return NextResponse.json({ received: true, duplicate: true })
          }

          // Update order status with retry mechanism
          const updateData = {
            payment_status: "paid",
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString(),
          }

          const updateResult = await updateOrderWithRetry(supabaseAdmin, order.id, updateData)

          if (!updateResult.success) {
            const errorMessage = `Failed to update order ${order.order_number} after ${updateResult.attempt} attempts`
            console.error(`❌ ${errorMessage}:`, updateResult.error)

            await logWebhookEvent(
              supabaseAdmin,
              "checkout.session.completed",
              event.id,
              order.order_number,
              "error",
              errorMessage,
              {
                session_id: session.id,
                order_id: order.id,
                update_error: updateResult.error,
                attempts: updateResult.attempt,
              },
            )

            // Return error status to trigger Stripe retry
            return NextResponse.json(
              {
                error: "Database update failed",
                order_number: order.order_number,
                session_id: session.id,
              },
              { status: 500 },
            )
          }

          console.log(`✅ Order ${order.order_number} marked as paid (attempt ${updateResult.attempt})`)

          // Add timeline event
          try {
            await supabaseAdmin.from("order_timeline").insert({
              order_id: order.id,
              event_type: "payment_completed",
              event_description: "Payment completed via Stripe payment link",
              event_data: {
                checkout_session_id: session.id,
                payment_intent_id: session.payment_intent,
                amount_paid: session.amount_total,
                currency: session.currency,
                payment_method_types: session.payment_method_types,
                lookup_method: lookupMethod,
                update_attempts: updateResult.attempt,
              },
              created_by: "stripe_webhook",
              created_at: new Date().toISOString(),
            })

            console.log(`📝 Timeline event added for order ${order.order_number}`)
          } catch (timelineError) {
            console.warn(`⚠️ Failed to add timeline event:`, timelineError)
            // Don't fail the webhook for timeline errors
          }

          // Update customer payment status if customer_id exists
          if (order.customer_id) {
            try {
              await supabaseAdmin
                .from("customers")
                .update({
                  last_payment_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", order.customer_id)

              console.log(`✅ Customer payment status updated for order ${order.order_number}`)
            } catch (customerError) {
              console.warn(`⚠️ Failed to update customer payment status:`, customerError)
              // Don't fail the webhook for customer update errors
            }
          }

          // Trigger Zapier webhook for order completion
          console.log(`🎉 Triggering order completed webhook for order ${order.order_number}`)
          try {
            const webhookResult = await zapierWebhook.triggerOrderCompletedWebhook(
              order.id,
              {
                method: "stripe_checkout",
                amount_paid: session.amount_total || 0,
                paid_at: new Date().toISOString(),
                stripe_payment_intent_id: session.payment_intent as string,
              },
              {
                source: "stripe_webhook",
                trigger: "checkout_session_completed",
              },
            )

            if (!webhookResult.success) {
              console.error("WARNING: Order completed webhook failed:", webhookResult.error)
            } else {
              console.log("✅ Order completed webhook triggered successfully")
            }
          } catch (webhookError) {
            console.error("WARNING: Failed to trigger order completed webhook:", webhookError)
          }

          await logWebhookEvent(
            supabaseAdmin,
            "checkout.session.completed",
            event.id,
            order.order_number,
            "success",
            `Order successfully marked as paid via ${lookupMethod}`,
            {
              session_id: session.id,
              order_id: order.id,
              amount_paid: session.amount_total,
              update_attempts: updateResult.attempt,
            },
          )
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`⏰ Checkout session expired: ${session.id}`)

        await logWebhookEvent(
          supabaseAdmin,
          "checkout.session.expired",
          event.id,
          session.metadata?.order_number || null,
          "warning",
          `Checkout session expired: ${session.id}`,
          { session_id: session.id, customer_email: session.customer_details?.email },
        )

        if (session.metadata?.order_number) {
          const { order } = await findOrderByPayment(supabaseAdmin, session)

          if (order) {
            // Add timeline event for expired session
            try {
              await supabaseAdmin.from("order_timeline").insert({
                order_id: order.id,
                event_type: "payment_link_expired",
                event_description: "Payment link expired without completion",
                event_data: {
                  checkout_session_id: session.id,
                  expired_at: new Date().toISOString(),
                },
                created_by: "stripe_webhook",
                created_at: new Date().toISOString(),
              })

              console.log(`📝 Payment link expiration recorded for order ${order.order_number}`)
            } catch (error) {
              console.warn(`⚠️ Failed to record expiration:`, error)
            }
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        console.log(`💰 Invoice payment succeeded: ${invoice.id}`)

        await logWebhookEvent(
          supabaseAdmin,
          "invoice.payment_succeeded",
          event.id,
          null,
          "success",
          `Processing invoice payment: ${invoice.id}`,
          {
            invoice_id: invoice.id,
            customer_email: invoice.customer_email,
            amount_paid: invoice.amount_paid,
          },
        )

        // Find the order by Stripe invoice ID
        const { data: order, error: orderError } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("stripe_invoice_id", invoice.id)
          .single()

        if (orderError || !order) {
          const errorMessage = `Order not found for invoice: ${invoice.id}`
          console.error(`❌ ${errorMessage}`)

          await logWebhookEvent(supabaseAdmin, "invoice.payment_succeeded", event.id, null, "error", errorMessage, {
            invoice_id: invoice.id,
            customer_email: invoice.customer_email,
          })

          return NextResponse.json({
            received: true,
            error: "Order not found",
            invoice_id: invoice.id,
          })
        }

        // Update order status with retry mechanism
        const updateData = {
          status: "paid",
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const updateResult = await updateOrderWithRetry(supabaseAdmin, order.id, updateData)

        if (!updateResult.success) {
          const errorMessage = `Failed to update order ${order.order_number} for invoice payment`
          console.error(`❌ ${errorMessage}:`, updateResult.error)

          await logWebhookEvent(
            supabaseAdmin,
            "invoice.payment_succeeded",
            event.id,
            order.order_number,
            "error",
            errorMessage,
            {
              invoice_id: invoice.id,
              order_id: order.id,
              update_error: updateResult.error,
            },
          )

          return NextResponse.json(
            {
              error: "Database update failed",
              order_number: order.order_number,
              invoice_id: invoice.id,
            },
            { status: 500 },
          )
        }

        console.log(`✅ Order ${order.order_number} marked as paid via invoice`)

        // Add timeline event
        try {
          await supabaseAdmin.from("order_timeline").insert([
            {
              order_id: order.id,
              event_type: "payment_received",
              event_description: "Payment received via Stripe invoice",
              event_data: {
                stripe_invoice_id: invoice.id,
                amount_paid: invoice.amount_paid,
                currency: invoice.currency,
                payment_intent: invoice.payment_intent,
                customer_email: invoice.customer_email,
              },
              created_by: "stripe_webhook",
              created_at: new Date().toISOString(),
            },
          ])

          console.log(`📝 Invoice payment timeline event added for order ${order.order_number}`)
        } catch (error) {
          console.warn(`⚠️ Failed to add timeline event:`, error)
        }

        // Trigger Zapier webhook for order completion
        console.log(`🎉 Triggering order completed webhook for order ${order.order_number}`)
        try {
          const webhookResult = await zapierWebhook.triggerOrderCompletedWebhook(
            order.id,
            {
              method: "stripe_invoice",
              amount_paid: invoice.amount_paid || 0,
              paid_at: new Date().toISOString(),
              stripe_invoice_id: invoice.id,
            },
            {
              source: "stripe_webhook",
              trigger: "invoice_payment_succeeded",
            },
          )

          if (!webhookResult.success) {
            console.error("WARNING: Order completed webhook failed:", webhookResult.error)
          } else {
            console.log("✅ Order completed webhook triggered successfully")
          }
        } catch (webhookError) {
          console.error("WARNING: Failed to trigger order completed webhook:", webhookError)
        }

        await logWebhookEvent(
          supabaseAdmin,
          "invoice.payment_succeeded",
          event.id,
          order.order_number,
          "success",
          "Order successfully marked as paid via invoice",
          {
            invoice_id: invoice.id,
            order_id: order.id,
            amount_paid: invoice.amount_paid,
          },
        )
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        console.log(`❌ Invoice payment failed: ${invoice.id}`)

        await logWebhookEvent(
          supabaseAdmin,
          "invoice.payment_failed",
          event.id,
          null,
          "error",
          `Invoice payment failed: ${invoice.id}`,
          {
            invoice_id: invoice.id,
            failure_reason: invoice.last_finalization_error?.message,
            attempt_count: invoice.attempt_count,
          },
        )

        // Find the order by Stripe invoice ID
        const { data: order, error: orderError } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("stripe_invoice_id", invoice.id)
          .single()

        if (orderError || !order) {
          console.error("❌ Order not found for invoice:", invoice.id)
          break
        }

        // Update payment status
        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        if (updateError) {
          console.error("❌ Failed to update order:", updateError)
          break
        }

        // Add timeline event
        try {
          await supabaseAdmin.from("order_timeline").insert([
            {
              order_id: order.id,
              event_type: "payment_failed",
              event_description: "Payment failed for Stripe invoice",
              event_data: {
                stripe_invoice_id: invoice.id,
                failure_reason: invoice.last_finalization_error?.message || "Unknown error",
                attempt_count: invoice.attempt_count,
              },
              created_by: "stripe_webhook",
              created_at: new Date().toISOString(),
            },
          ])

          console.log(`📝 Payment failure recorded for order ${order.order_number}`)
        } catch (error) {
          console.warn(`⚠️ Failed to add timeline event:`, error)
        }
        break
      }

      case "invoice.finalized": {
        const invoice = event.data.object
        console.log(`📄 Invoice finalized: ${invoice.id}`)

        // Find the order by Stripe invoice ID
        const { data: order, error: orderError } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("stripe_invoice_id", invoice.id)
          .single()

        if (orderError || !order) {
          console.error("❌ Order not found for invoice:", invoice.id)
          break
        }

        // Update invoice URLs
        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            stripe_invoice_url: invoice.hosted_invoice_url,
            stripe_invoice_pdf: invoice.invoice_pdf,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        if (updateError) {
          console.error("❌ Failed to update order with invoice URLs:", updateError)
          break
        }

        // Add timeline event
        try {
          await supabaseAdmin.from("order_timeline").insert([
            {
              order_id: order.id,
              event_type: "invoice_finalized",
              event_description: "Stripe invoice finalized and ready for payment",
              event_data: {
                stripe_invoice_id: invoice.id,
                invoice_url: invoice.hosted_invoice_url,
                invoice_pdf: invoice.invoice_pdf,
                due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
              },
              created_by: "stripe_webhook",
              created_at: new Date().toISOString(),
            },
          ])

          console.log(`📝 Invoice finalization recorded for order ${order.order_number}`)
        } catch (error) {
          console.warn(`⚠️ Failed to add timeline event:`, error)
        }
        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)

        await logWebhookEvent(
          supabaseAdmin,
          event.type,
          event.id,
          null,
          "warning",
          `Unhandled webhook event type: ${event.type}`,
          { event_type: event.type },
        )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("🚨 Webhook error:", error)

    try {
      await logWebhookEvent(
        supabaseAdmin,
        "webhook_error",
        "unknown",
        null,
        "error",
        `Webhook processing error: ${error instanceof Error ? error.message : "Unknown error"}`,
        { error: error instanceof Error ? error.stack : String(error) },
      )
    } catch (logError) {
      console.error("Failed to log webhook error:", logError)
    }

    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 })
  }
}
