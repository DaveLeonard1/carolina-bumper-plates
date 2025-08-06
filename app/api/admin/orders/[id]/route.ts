import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"
import { zapierWebhook } from "@/lib/zapier-webhook-core"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create Supabase admin client - guard against initialization errors
    const supabaseAdmin = createSupabaseAdmin()
    if (!supabaseAdmin) {
      console.error("Failed to initialize Supabase admin client")
      return NextResponse.json({ success: false, error: "Database connection error" }, { status: 500 })
    }
    
    const orderId = params.id
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Enrich order items with product images
    let enrichedOrderItems = order.order_items || []

    if (Array.isArray(enrichedOrderItems) && enrichedOrderItems.length > 0) {
      try {
        // Get unique weights from order items
        const weights = [...new Set(enrichedOrderItems.map((item) => item?.weight).filter(Boolean))]

        if (weights.length === 0) {
          console.log("No valid weights found in order items")
          return
        }

        // Fetch products with matching weights
        const { data: products, error: productsError } = await supabaseAdmin
          .from("products")
          .select("weight, image_url, title")
          .in("weight", weights)
          .eq("available", true)

        if (!productsError && products) {
          // Create a weight-to-product mapping
          const productMap = new Map()
          products.forEach((product) => {
            productMap.set(product.weight, product)
          })

          // Enrich order items with product data
          enrichedOrderItems = enrichedOrderItems.map((item) => {
            const product = productMap.get(item.weight)
            return {
              ...item,
              image_url: product?.image_url || null,
              product_title: product?.title || `${item.weight}lb Bumper Plate`,
            }
          })

          console.log("Enriched order items:", enrichedOrderItems)
        } else {
          console.error("Products fetch error:", productsError)
        }
      } catch (enrichmentError) {
        console.error("Order items enrichment error:", enrichmentError)
        // Continue without enrichment if there's an error
      }
    }

    // Get order timeline
    const { data: timeline, error: timelineError } = await supabaseAdmin
      .from("order_timeline")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })

    if (timelineError) {
      console.error("Timeline fetch error:", timelineError)
    }

    // Get customer details if user_id exists
    let customer = null
    if (order.user_id) {
      const { data: customerData, error: customerError } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("user_id", order.user_id)
        .single()

      if (!customerError && customerData) {
        customer = customerData
      }
    }

    // Parse order items if needed
    let orderItemsToReturn = enrichedOrderItems
    if (typeof order.order_items === 'string') {
      try {
        // Try to parse if it's a string
        orderItemsToReturn = JSON.parse(order.order_items)
      } catch (parseError) {
        console.error("Failed to parse order items:", parseError)
        // Keep the original enriched items if parsing fails
      }
    }
    
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        order_items: orderItemsToReturn, // Use parsed or enriched items
        customer,
        timeline: timeline || [],
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
    const orderId = params.id
    const body = await request.json()
    const { action, data } = body

    // Get current order
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Prevent changes to paid orders (except for allowed actions)
    const allowedActionsForPaidOrders = ["add_note", "mark_fulfilled", "update_tracking"]
    if (currentOrder.payment_status === "paid" && !allowedActionsForPaidOrders.includes(action)) {
      return NextResponse.json({ success: false, error: "Paid orders can only be fulfilled, have tracking updated, or have notes added" }, { status: 400 })
    }

    let updateData: any = {}
    let timelineEvent: any = {
      order_id: Number.parseInt(orderId),
      created_by: "admin", // In a real app, this would be the logged-in admin user
      created_at: new Date().toISOString(),
    }

    switch (action) {
      case "mark_fulfilled":
        // Only allow paid orders to be fulfilled
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
        
        // After update, send fulfillment email and trigger webhook
        setTimeout(async () => {
          try {
            // Get updated order with all details for email
            const { data: updatedOrder, error: orderError } = await supabaseAdmin
              .from("orders")
              .select(`*, customers(*)`) 
              .eq("id", orderId)
              .single()
            
            if (orderError || !updatedOrder) {
              console.error("Error fetching updated order for fulfillment email:", orderError)
              return
            }
            
            // Parse order items for the email
            let orderItems = []
            if (updatedOrder.order_items) {
              try {
                orderItems = typeof updatedOrder.order_items === "string" 
                  ? JSON.parse(updatedOrder.order_items)
                  : updatedOrder.order_items
              } catch (e) {
                console.error("Error parsing order items for fulfillment email:", e)
              }
            }
            
            // Send email notification
            await emailService.sendFulfillmentEmail(
              updatedOrder.customer_email,
              updatedOrder.order_number,
              updatedOrder.customer_name || "Valued Customer",
              orderItems,
              updatedOrder.total_amount || 0
            )
            
            // Trigger webhook for integrations
            await zapierWebhook.triggerOrderCompletedWebhook(
              orderId,
              {
                method: "fulfilled",
                amount_paid: updatedOrder.total_amount || 0,
                paid_at: updatedOrder.paid_at || new Date().toISOString(),
              },
              { source: "admin", trigger: "order_fulfilled" }
            )
            
            console.log(`✅ Fulfillment email sent for order #${updatedOrder.order_number}`)
          } catch (error) {
            console.error("Error sending fulfillment email:", error)
            // Non-blocking - we don't fail the request if email fails
          }
        }, 100) // Slight delay to ensure DB update completes first
        
        break
        
      case "send_invoice":
        return NextResponse.json(
          { success: false, error: "Please use the Stripe invoice API endpoint" },
          { status: 400 },
        )

      case "mark_paid":
        // Check if order is already paid
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
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 })
  }
}
