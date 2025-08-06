import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripe } from "@/lib/stripe"
import { zapierWebhook } from "@/lib/zapier-webhook-core"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  console.log("=== PAYMENT LINK CREATION START ===")

  try {
    // Parse request body with error handling
    let orderId: any
    try {
      const body = await request.json()
      orderId = body.orderId
    } catch (parseError) {
      console.error("ERROR: Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          debug: {
            message: "Failed to parse JSON from request body",
            error: parseError instanceof Error ? parseError.message : String(parseError)
          }
        },
        { status: 400 }
      )
    }
    
    console.log("1. Received orderId:", orderId)

    if (!orderId) {
      console.error("ERROR: Order ID is required")
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseAdmin()
    
    // Initialize Stripe with error handling for missing env vars
    let stripe: any
    try {
      stripe = await getStripe()
    } catch (stripeInitError) {
      console.error("ERROR: Failed to initialize Stripe:", stripeInitError)
      return NextResponse.json(
        {
          success: false,
          error: stripeInitError instanceof Error ? stripeInitError.message : "Failed to initialize Stripe. Please check environment variables.",
          debug: {
            message: "Stripe initialization failed. Ensure STRIPE_TEST_SECRET_KEY or STRIPE_LIVE_SECRET_KEY is set.",
            error: stripeInitError instanceof Error ? stripeInitError.message : String(stripeInitError)
          }
        },
        { status: 500 }
      )
    }

    // 1. Check if order exists and get current status
    console.log("2. Checking order status and payment link existence...")
    const { data: orderCheck, error: orderCheckError } = await supabase
      .from("orders")
      .select("id, order_number, payment_link_url, payment_link_created_at, order_locked, payment_status")
      .eq("id", orderId)
      .single()

    if (orderCheckError || !orderCheck) {
      console.error("ERROR: Order not found:", {
        orderId,
        error: orderCheckError,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Order not found with ID: ${orderId}`,
          debug: {
            orderId,
            error: orderCheckError?.message,
            code: orderCheckError?.code,
          },
        },
        { status: 404 },
      )
    }

    // 2. Check if payment link already exists
    if (orderCheck.payment_link_url) {
      console.log("3. Payment link already exists:", orderCheck.payment_link_url)
      return NextResponse.json({
        success: true,
        paymentUrl: orderCheck.payment_link_url,
        message: "Payment link already exists",
        alreadyExists: true,
        createdAt: orderCheck.payment_link_created_at,
      })
    }

    console.log("3. Order exists and no payment link found, proceeding...")

    // 3. Load complete order data
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
      console.log("4a. Order with customers join:", { order: !!order, error: orderError?.message })
    } catch (joinError) {
      console.log("4b. Customers join failed, trying without join:", joinError)

      const fallbackResult = await supabase.from("orders").select("*").eq("id", orderId).single()
      order = fallbackResult.data
      orderError = fallbackResult.error
      console.log("4c. Order without join:", { order: !!order, error: orderError?.message })
    }

    if (orderError || !order) {
      console.error("ERROR: Failed to load order:", orderError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to load order details",
          debug: {
            orderId,
            error: orderError?.message,
          },
        },
        { status: 500 },
      )
    }

    // 4. Parse order items
    console.log("5. Parsing order items...")
    let orderItems: Array<{ weight: number; quantity: number; price: number }>

    try {
      if (typeof order.order_items === "string") {
        orderItems = JSON.parse(order.order_items)
      } else if (Array.isArray(order.order_items)) {
        orderItems = order.order_items
      } else if (order.order_items && typeof order.order_items === "object") {
        orderItems = [order.order_items]
      } else {
        throw new Error(`Invalid order items format: ${typeof order.order_items}`)
      }
    } catch (parseError) {
      console.error("ERROR: Order items parsing failed:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order items data",
          debug: {
            orderItems: order.order_items,
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          },
        },
        { status: 400 },
      )
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No items found in order",
        },
        { status: 400 },
      )
    }

    console.log("6. Order items parsed:", { itemCount: orderItems.length })

    // 5. Handle customer data
    console.log("7. Processing customer data...")
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

    // 6. Ensure Stripe Customer exists
    console.log("8. Ensuring Stripe customer exists...")
    let stripeCustomerId = customerData.stripe_customer_id

    if (!stripeCustomerId) {
      const customerName =
        customerData.first_name && customerData.last_name
          ? `${customerData.first_name} ${customerData.last_name}`
          : order.customer_name || customerData.email

      try {
        const stripeCustomer = await stripe.customers.create({
          email: customerData.email,
          name: customerName,
          phone: order.customer_phone || undefined,
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
            source: "carolina-bumper-plates",
          },
        })

        stripeCustomerId = stripeCustomer.id
        console.log("8a. Stripe customer created:", stripeCustomerId)

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
      } catch (stripeError) {
        console.error("ERROR: Failed to create Stripe customer:", stripeError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create Stripe customer",
          },
          { status: 500 },
        )
      }
    }

    // 7. Get products with Stripe price IDs
    console.log("9. Loading products...")
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("weight, stripe_price_id, stripe_product_id, title, selling_price")
      .in(
        "weight",
        orderItems.map((item) => item.weight),
      )

    if (productsError) {
      console.error("ERROR: Products fetch failed:", productsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch products",
        },
        { status: 500 },
      )
    }

    // 8. Build line items
    console.log("10. Building line items...")
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
      return NextResponse.json(
        {
          success: false,
          error: `Products not synced with Stripe: ${missingProducts.join(", ")}`,
        },
        { status: 400 },
      )
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid line items could be created",
        },
        { status: 400 },
      )
    }

    // 9. Create Checkout Session
    console.log("11. Creating Stripe Checkout Session...")
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    try {
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
          source: "carolina-bumper-plates-admin",
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

      console.log("12. Checkout session created:", session.id)

      // 10. Update order with payment link and lock it
      console.log("13. Updating order with payment link and locking...")
      const now = new Date().toISOString()

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          stripe_checkout_session_id: session.id,
          payment_link_url: session.url,
          payment_link_created_at: now,
          payment_status: "pending_payment",
          order_locked: true,
          order_locked_reason: "Payment link created - order modifications restricted",
          updated_at: now,
        })
        .eq("id", orderId)

      if (updateError) {
        console.error("ERROR: Failed to update order:", updateError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to save payment link",
          },
          { status: 500 },
        )
      }

      // 11. Add timeline event
      console.log("14. Adding timeline event...")
      try {
        await supabase.from("order_timeline").insert({
          order_id: orderId,
          event_type: "payment_link_created",
          event_description: "Payment link created - order locked for modifications",
          event_data: {
            checkout_session_id: session.id,
            payment_url: session.url,
            order_locked: true,
          },
          created_by: "admin",
        })
      } catch (timelineError) {
        console.error("WARNING: Failed to add timeline event:", timelineError)
      }

      // 12. Trigger Zapier webhook for payment link creation
      console.log("15. Triggering Zapier webhook...")
      try {
        const webhookResult = await zapierWebhook.triggerPaymentLinkWebhook(orderId, {
          source: "payment_link_creation",
          created_via: "individual",
        })

        if (!webhookResult.success) {
          console.error("WARNING: Payment link webhook failed:", webhookResult.error)
          // Log webhook failure but don't fail payment link creation
        } else {
          console.log("✅ Payment link webhook triggered successfully")
        }
      } catch (webhookError) {
        console.error("WARNING: Failed to trigger payment link webhook:", webhookError)
        // Don't fail the payment link creation if webhook fails
      }

      // 13. Send payment link email
      console.log("16. Sending payment link email...")
      try {
        const customerName = 
          customerData.first_name && customerData.last_name 
            ? `${customerData.first_name} ${customerData.last_name}` 
            : order.customer_name || 'Customer';

        const emailResult = await emailService.sendPaymentLinkEmail(
          customerData.email,
          order.order_number,
          customerName,
          session.url!,
          {
            total_amount: order.total_amount,
            order_items: orderItems,
            order_number: order.order_number
          }
        );

        if (!emailResult.success) {
          console.error("WARNING: Payment link email failed:", emailResult.error);
          // Log email failure but don't fail payment link creation
        } else {
          console.log("✅ Payment link email sent successfully");
        }
      } catch (emailError) {
        console.error("WARNING: Failed to send payment link email:", emailError);
        // Don't fail the payment link creation if email fails
      }

      console.log("=== PAYMENT LINK CREATION SUCCESS ===")
      return NextResponse.json({
        success: true,
        paymentUrl: session.url,
        sessionId: session.id,
        message: "Payment link created successfully",
        orderLocked: true,
        createdAt: now,
        debug: {
          orderId,
          orderNumber: order.order_number,
          customerEmail: customerData.email,
          lineItemCount: lineItems.length,
        },
      })
    } catch (stripeSessionError) {
      console.error("ERROR: Failed to create Stripe checkout session:", stripeSessionError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create payment session",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("=== PAYMENT LINK CREATION FAILED ===")
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payment link",
      },
      { status: 500 },
    )
  }
}
