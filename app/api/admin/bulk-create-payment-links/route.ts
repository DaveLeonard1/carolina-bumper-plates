import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripe } from "@/lib/stripe"
import { sendEmail } from "@/lib/email/mailgun"
import { generatePaymentLinkEmail } from "@/lib/email/templates"

interface BulkPaymentLinkResult {
  orderId: string
  orderNumber: string
  success: boolean
  paymentUrl?: string
  error?: string
  alreadyExists?: boolean
}

export async function POST(request: NextRequest) {
  console.log("=== BULK PAYMENT LINK CREATION START ===")

  try {
    const { orderIds, filters } = await request.json()
    console.log("1. Received request:", { orderIds: orderIds?.length, filters })

    const supabase = createSupabaseAdmin()
    const stripe = await getStripe()

    let targetOrders: any[] = []

    // Determine which orders to process
    if (orderIds && orderIds.length > 0) {
      // Process specific order IDs
      console.log("2a. Processing specific order IDs:", orderIds)
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, payment_link_url")
        .in("id", orderIds)

      if (error) {
        console.error("Error fetching specific orders:", error)
        return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 })
      }

      targetOrders = orders || []
    } else {
      // Process all eligible orders based on filters
      console.log("2b. Processing all eligible orders")
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, payment_link_url")
        .or("status.eq.pending,status.eq.invoiced")
        .or("payment_status.is.null,payment_status.neq.paid")

      if (error) {
        console.error("Error fetching eligible orders:", error)
        return NextResponse.json({ success: false, error: "Failed to fetch eligible orders" }, { status: 500 })
      }

      targetOrders = orders || []
    }

    console.log("3. Found orders to process:", targetOrders.length)

    if (targetOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No eligible orders found for payment link creation",
        results: [],
        summary: { total: 0, successful: 0, failed: 0, skipped: 0 },
      })
    }

    // Filter out orders that already have payment links
    const ordersNeedingLinks = targetOrders.filter((order) => !order.payment_link_url)
    const ordersWithExistingLinks = targetOrders.filter((order) => order.payment_link_url)

    console.log("4. Orders analysis:", {
      total: targetOrders.length,
      needingLinks: ordersNeedingLinks.length,
      existingLinks: ordersWithExistingLinks.length,
    })

    const results: BulkPaymentLinkResult[] = []

    // Add existing links to results
    ordersWithExistingLinks.forEach((order) => {
      results.push({
        orderId: order.id,
        orderNumber: order.order_number,
        success: true,
        paymentUrl: order.payment_link_url,
        alreadyExists: true,
      })
    })

    // Process orders that need new payment links
    let successCount = 0
    let failCount = 0

    for (const order of ordersNeedingLinks) {
      console.log(`5. Processing order ${order.order_number}...`)

      try {
        // Create payment link for this order
        const linkResult = await createPaymentLinkForOrder(order.id, supabase, stripe)

        if (linkResult.success) {
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: true,
            paymentUrl: linkResult.paymentUrl,
          })
          successCount++
          console.log(`✅ Success for order ${order.order_number}`)
        } else {
          results.push({
            orderId: order.id,
            orderNumber: order.order_number,
            success: false,
            error: linkResult.error,
          })
          failCount++
          console.log(`❌ Failed for order ${order.order_number}: ${linkResult.error}`)
        }
      } catch (error) {
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        failCount++
        console.log(`❌ Exception for order ${order.order_number}:`, error)
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const summary = {
      total: targetOrders.length,
      successful: successCount,
      failed: failCount,
      skipped: ordersWithExistingLinks.length,
    }

    console.log("=== BULK PAYMENT LINK CREATION COMPLETE ===")
    console.log("Summary:", summary)

    return NextResponse.json({
      success: true,
      message: `Processed ${summary.total} orders: ${summary.successful} successful, ${summary.failed} failed, ${summary.skipped} skipped`,
      results,
      summary,
    })
  } catch (error) {
    console.error("=== BULK PAYMENT LINK CREATION FAILED ===")
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create bulk payment links",
      },
      { status: 500 },
    )
  }
}

// Helper function to create payment link for a single order
async function createPaymentLinkForOrder(orderId: string, supabase: any, stripe: any) {
  try {
    // Load complete order data
    let order, orderError
    try {
      const result = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            id,
            email,
            first_name,
            last_name,
            stripe_customer_id
          )
        `)
        .eq("id", orderId)
        .single()

      order = result.data
      orderError = result.error
    } catch (joinError) {
      const fallbackResult = await supabase.from("orders").select("*").eq("id", orderId).single()
      order = fallbackResult.data
      orderError = fallbackResult.error
    }

    if (orderError || !order) {
      return { success: false, error: "Failed to load order details" }
    }

    // Parse order items
    let orderItems: Array<{ weight: number; quantity: number; price: number }>
    try {
      if (typeof order.order_items === "string") {
        orderItems = JSON.parse(order.order_items)
      } else if (Array.isArray(order.order_items)) {
        orderItems = order.order_items
      } else if (order.order_items && typeof order.order_items === "object") {
        orderItems = [order.order_items]
      } else {
        throw new Error("Invalid order items format")
      }
    } catch (parseError) {
      return { success: false, error: "Invalid order items data" }
    }

    if (!orderItems || orderItems.length === 0) {
      return { success: false, error: "No items found in order" }
    }

    // Handle customer data
    let customerData = {
      email: order.customer_email,
      first_name: null as string | null,
      last_name: null as string | null,
      stripe_customer_id: null as string | null,
    }

    if (order.customers) {
      customerData = {
        email: order.customers.email || order.customer_email,
        first_name: order.customers.first_name,
        last_name: order.customers.last_name,
        stripe_customer_id: order.customers.stripe_customer_id,
      }
    } else {
      const { data: customerLookup } = await supabase
        .from("customers")
        .select("first_name, last_name, stripe_customer_id")
        .eq("email", order.customer_email)
        .single()

      if (customerLookup) {
        customerData.first_name = customerLookup.first_name
        customerData.last_name = customerLookup.last_name
        customerData.stripe_customer_id = customerLookup.stripe_customer_id
      } else if (order.customer_name) {
        const nameParts = order.customer_name.split(" ")
        customerData.first_name = nameParts[0] || null
        customerData.last_name = nameParts.slice(1).join(" ") || null
      }
    }

    // Ensure Stripe Customer exists
    let stripeCustomerId = customerData.stripe_customer_id

    if (!stripeCustomerId) {
      const customerName =
        customerData.first_name && customerData.last_name
          ? `${customerData.first_name} ${customerData.last_name}`
          : order.customer_name || customerData.email

      const stripeCustomer = await stripe.customers.create({
        email: customerData.email,
        name: customerName,
        phone: order.customer_phone || undefined,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          source: "carolina-bumper-plates-bulk",
        },
      })

      stripeCustomerId = stripeCustomer.id

      try {
        await supabase.from("customers").upsert(
          {
            email: customerData.email,
            first_name: customerData.first_name,
            last_name: customerData.last_name,
            stripe_customer_id: stripeCustomerId,
            phone: order.customer_phone,
          },
          { onConflict: "email" },
        )
      } catch (saveError) {
        console.error("WARNING: Failed to save Stripe customer ID:", saveError)
      }
    }

    // Get products with Stripe price IDs
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("weight, stripe_price_id, stripe_product_id, title, selling_price")
      .in(
        "weight",
        orderItems.map((item) => item.weight),
      )

    if (productsError) {
      return { success: false, error: "Failed to fetch products" }
    }

    // Build line items
    const lineItems = []
    const missingProducts = []

    for (const item of orderItems) {
      const product = products?.find((p) => p.weight === item.weight)

      if (!product || !product.stripe_price_id) {
        missingProducts.push(`${item.weight}lb plate`)
        continue
      }

      lineItems.push({
        price: product.stripe_price_id,
        quantity: item.quantity,
      })
    }

    if (missingProducts.length > 0) {
      return { success: false, error: `Products not synced with Stripe: ${missingProducts.join(", ")}` }
    }

    if (lineItems.length === 0) {
      return { success: false, error: "No valid line items could be created" }
    }

    // Create Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${baseUrl}/admin/orders/${order.id}`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        source: "carolina-bumper-plates-bulk",
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Payment for Order #${order.order_number}`,
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
          },
        },
      },
    })

    // Update order with payment link and lock it
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        payment_link_url: session.url,
        payment_link_created_at: now,
        payment_status: "pending_payment",
        order_locked: true,
        order_locked_reason: "Payment link created via bulk operation",
        updated_at: now,
      })
      .eq("id", orderId)

    if (updateError) {
      return { success: false, error: "Failed to save payment link" }
    }

    // Add timeline event
    try {
      await supabase.from("order_timeline").insert({
        order_id: orderId,
        event_type: "payment_link_created",
        event_description: "Payment link created via bulk operation",
        event_data: {
          checkout_session_id: session.id,
          payment_url: session.url,
          bulk_operation: true,
        },
        created_by: "admin",
      })
    } catch (timelineError) {
      console.error("WARNING: Failed to add timeline event:", timelineError)
    }

    // Send payment link email to customer
    try {
      const emailTemplate = generatePaymentLinkEmail({
        customerName: `${customerData.first_name} ${customerData.last_name}`,
        orderNumber: order.order_number,
        paymentUrl: session.url,
        orderTotal: order.subtotal || 0,
        orderItems: orderItems.map((item: any) => ({
          weight: item.weight,
          quantity: item.quantity,
          price: item.price,
        })),
      })

      const emailResult = await sendEmail({
        to: customerData.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })

      if (emailResult.success) {
        // Add timeline event for email sent
        try {
          await supabase.from("order_timeline").insert({
            order_id: orderId,
            event_type: "email_sent",
            event_description: "Payment link email sent to customer (bulk)",
            event_data: {
              email_type: "payment_link",
              recipient: customerData.email,
              message_id: emailResult.messageId,
              bulk_operation: true,
            },
            created_by: "admin",
          })
        } catch (timelineError) {
          console.warn("Failed to add email timeline event:", timelineError)
        }
      } else {
        console.error("Failed to send payment link email:", emailResult.error)
        // Add timeline event for failed email
        try {
          await supabase.from("order_timeline").insert({
            order_id: orderId,
            event_type: "email_failed",
            event_description: "Failed to send payment link email (bulk)",
            event_data: {
              email_type: "payment_link",
              recipient: customerData.email,
              error: emailResult.error,
              bulk_operation: true,
            },
            created_by: "admin",
          })
        } catch (timelineError) {
          console.warn("Failed to add email failure timeline event:", timelineError)
        }
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError)
    }

    return {
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
    }
  } catch (error) {
    console.error("Error creating payment link for order:", orderId, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
