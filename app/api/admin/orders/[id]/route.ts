import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create Supabase admin client - guard against initialization errors
    let supabaseAdmin
    try {
      supabaseAdmin = createSupabaseAdmin()
      if (!supabaseAdmin) {
        console.error("Failed to initialize Supabase admin client")
        return NextResponse.json({ success: false, error: "Database connection error" }, { status: 500 })
      }
    } catch (initError) {
      console.error("Supabase initialization error:", initError)
      return NextResponse.json({ success: false, error: "Database initialization failed" }, { status: 500 })
    }
    
    const orderId = params.id
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 })
    }

    // Get order details with better error handling
    let order
    try {
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderError) {
        console.error("Order fetch error:", orderError)
        if (orderError.code === 'PGRST116') {
          return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
        }
        return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 })
      }

      if (!orderData) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
      }

      order = orderData
    } catch (fetchError) {
      console.error("Order fetch exception:", fetchError)
      return NextResponse.json({ success: false, error: "Database query failed" }, { status: 500 })
    }

    // Safely parse order items
    let orderItems = []
    try {
      if (order.order_items) {
        if (typeof order.order_items === 'string') {
          orderItems = JSON.parse(order.order_items)
        } else if (Array.isArray(order.order_items)) {
          orderItems = order.order_items
        }
      }
    } catch (parseError) {
      console.error("Order items parse error:", parseError)
      // Continue with empty array if parsing fails
      orderItems = []
    }

    // Enrich order items with product images (with error handling)
    let enrichedOrderItems = orderItems
    if (Array.isArray(orderItems) && orderItems.length > 0) {
      try {
        // Get unique weights from order items, filtering out invalid values
        const weights = [...new Set(
          orderItems
            .map((item) => item?.weight)
            .filter((weight) => weight && typeof weight === 'number' && weight > 0)
        )]

        if (weights.length > 0) {
          // Fetch products with matching weights
          const { data: products, error: productsError } = await supabaseAdmin
            .from("products")
            .select("weight, image_url, title")
            .in("weight", weights)
            .eq("available", true)

          if (!productsError && products && Array.isArray(products)) {
            // Create a weight-to-product mapping
            const productMap = new Map()
            products.forEach((product) => {
              if (product && product.weight) {
                productMap.set(product.weight, product)
              }
            })

            // Enrich order items with product data
            enrichedOrderItems = orderItems.map((item) => {
              if (!item || typeof item.weight !== 'number') {
                return item
              }
              
              const product = productMap.get(item.weight)
              return {
                ...item,
                image_url: product?.image_url || null,
                product_title: product?.title || `${item.weight}lb Bumper Plate`,
              }
            })
          } else if (productsError) {
            console.error("Products fetch error:", productsError)
            // Continue with non-enriched items
          }
        }
      } catch (enrichmentError) {
        console.error("Order items enrichment error:", enrichmentError)
        // Continue with non-enriched items if there's an error
      }
    }

    // Get order timeline with error handling
    let timeline = []
    try {
      const { data: timelineData, error: timelineError } = await supabaseAdmin
        .from("order_timeline")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true })

      if (timelineError) {
        console.error("Timeline fetch error:", timelineError)
        // Continue with empty timeline
      } else if (timelineData) {
        timeline = timelineData
      }
    } catch (timelineException) {
      console.error("Timeline fetch exception:", timelineException)
      // Continue with empty timeline
    }

    // Get customer details if user_id exists
    let customer = null
    if (order.user_id) {
      try {
        const { data: customerData, error: customerError } = await supabaseAdmin
          .from("customers")
          .select("*")
          .eq("user_id", order.user_id)
          .single()

        if (!customerError && customerData) {
          customer = customerData
        } else if (customerError && customerError.code !== 'PGRST116') {
          console.error("Customer fetch error:", customerError)
        }
      } catch (customerException) {
        console.error("Customer fetch exception:", customerException)
        // Continue without customer data
      }
    }
    
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        order_items: enrichedOrderItems,
        customer,
        timeline,
      },
    })
  } catch (error) {
    console.error("Order detail fetch error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fetch order details: ${errorMessage}` 
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Database connection error" }, { status: 500 })
    }

    const orderId = params.id
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { action, data } = body
    if (!action) {
      return NextResponse.json({ success: false, error: "Missing action parameter" }, { status: 400 })
    }

    // Get current order
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (fetchError || !currentOrder) {
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 })
    }

    // Prevent changes to paid orders (except for allowed actions)
    const allowedActionsForPaidOrders = ["add_note", "mark_fulfilled", "update_tracking"]
    if (currentOrder.payment_status === "paid" && !allowedActionsForPaidOrders.includes(action)) {
      return NextResponse.json({ 
        success: false, 
        error: "Paid orders can only be fulfilled, have tracking updated, or have notes added" 
      }, { status: 400 })
    }

    let updateData: any = {}
    let timelineEvent: any = {
      order_id: Number.parseInt(orderId),
      created_by: "admin",
      created_at: new Date().toISOString(),
    }

    switch (action) {
      case "mark_fulfilled":
        if (currentOrder.payment_status !== "paid") {
          return NextResponse.json(
            { success: false, error: "Only paid orders can be marked as fulfilled" },
            { status: 400 }
          )
        }
        
        updateData = {
          status: "fulfilled",
          fulfilled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        timelineEvent = {
          ...timelineEvent,
          event_type: "order_fulfilled",
          event_description: "Order marked as fulfilled",
          event_data: {
            previous_status: currentOrder.status,
            fulfillment_notes: data?.notes || ""
          },
        }
        break
        
      case "send_invoice":
        return NextResponse.json(
          { success: false, error: "Please use the Stripe invoice API endpoint" },
          { status: 400 },
        )

      case "mark_paid":
        if (currentOrder.payment_status === "paid") {
          return NextResponse.json(
            { success: false, error: "Order is already paid and cannot be modified" },
            { status: 400 },
          )
        }

        updateData = {
          status: "completed",
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        timelineEvent = {
          ...timelineEvent,
          event_type: "payment_received",
          event_description: "Payment received and order marked as completed (manual)",
          event_data: {
            previous_status: currentOrder.status,
            payment_method: "manual",
          },
        }
        break

      case "cancel_order":
        updateData = {
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: data?.reason || "Cancelled by administrator",
          updated_at: new Date().toISOString(),
        }
        timelineEvent = {
          ...timelineEvent,
          event_type: "order_cancelled",
          event_description: `Order cancelled by administrator: ${data?.reason || "No reason provided"}`,
          event_data: {
            previous_status: currentOrder.status,
            reason: data?.reason || "Cancelled by administrator",
          },
        }
        break

      case "update_tracking":
        updateData = {
          tracking_number: data?.tracking_number,
          shipping_method: data?.shipping_method,
          shipped_at: data?.tracking_number ? new Date().toISOString() : null,
          status: data?.tracking_number && currentOrder.status === "invoiced" ? "shipped" : currentOrder.status,
          updated_at: new Date().toISOString(),
        }
        timelineEvent = {
          ...timelineEvent,
          event_type: "tracking_updated",
          event_description: `Tracking information updated${data?.tracking_number ? `: ${data.tracking_number}` : ""}`,
          event_data: {
            tracking_number: data?.tracking_number,
            shipping_method: data?.shipping_method,
          },
        }
        break

      case "add_note":
        updateData = {
          admin_notes: data?.note,
          updated_at: new Date().toISOString(),
        }
        timelineEvent = {
          ...timelineEvent,
          event_type: "note_added",
          event_description: "Administrator added a note",
          event_data: { note: data?.note },
        }
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Update order
    const { error: updateError } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId)

    if (updateError) {
      console.error("Order update error:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 })
    }

    // Add timeline event
    const { error: timelineError } = await supabaseAdmin.from("order_timeline").insert([timelineEvent])

    if (timelineError) {
      console.error("Timeline insert error:", timelineError)
      // Don't fail the request if timeline insert fails
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
    })
  } catch (error) {
    console.error("Order update error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ 
      success: false, 
      error: `Failed to update order: ${errorMessage}` 
    }, { status: 500 })
  }
}
