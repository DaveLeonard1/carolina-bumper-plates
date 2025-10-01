import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    const orderNumber = params.orderNumber
    const updateData = await request.json()

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Order number is required" }, { status: 400 })
    }

    // Check if we can use Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Order updates are temporarily unavailable" }, { status: 503 })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the order exists and can be modified
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.toUpperCase())
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    console.log("🔒 Order lock check:", {
      orderNumber: existingOrder.order_number,
      orderLocked: existingOrder.order_locked,
      paymentLinkUrl: !!existingOrder.payment_link_url,
      status: existingOrder.status,
      invoicedAt: existingOrder.invoiced_at,
      paymentStatus: existingOrder.payment_status,
    })

    // Enhanced order modification checks
    const cannotModifyReasons = []

    // Check if order is explicitly locked
    if (existingOrder.order_locked) {
      cannotModifyReasons.push("Order is locked")
    }

    // Check if payment link has been created
    if (existingOrder.payment_link_url) {
      cannotModifyReasons.push("Payment link has been generated")
    }

    // Check if order has been invoiced
    if (existingOrder.invoiced_at) {
      cannotModifyReasons.push("Order has been invoiced")
    }

    // Check if order status prevents modification
    if (existingOrder.status !== "pending") {
      cannotModifyReasons.push(`Order status is ${existingOrder.status}`)
    }

    // Check if payment has been made
    if (existingOrder.payment_status === "paid") {
      cannotModifyReasons.push("Order has been paid")
    }

    if (cannotModifyReasons.length > 0) {
      console.log("❌ Order modification blocked:", cannotModifyReasons)
      return NextResponse.json(
        {
          success: false,
          error: "This order can no longer be modified",
          reasons: cannotModifyReasons,
          details: `Order cannot be modified because: ${cannotModifyReasons.join(", ")}`,
        },
        { status: 400 },
      )
    }

    console.log("✅ Order can be modified, proceeding with update")

    // Update the order
    const { data, error } = await supabase
      .from("orders")
      .update({
        customer_name: updateData.customerName,
        customer_email: updateData.customerEmail,
        customer_phone: updateData.customerPhone,
        street_address: updateData.streetAddress,
        city: updateData.city,
        state: updateData.state,
        zip_code: updateData.zipCode,
        delivery_instructions: updateData.deliveryInstructions,
        delivery_option: updateData.deliveryOption,
        additional_notes: updateData.additionalNotes,
        order_items: updateData.orderItems,
        subtotal: updateData.subtotal,
        total_weight: updateData.totalWeight,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", orderNumber.toUpperCase())
      .select()
      .single()

    if (error) {
      console.error("Update order error:", error)
      return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 })
    }

    // Add timeline event for order modification
    try {
      await supabase.from("order_timeline").insert({
        order_id: existingOrder.id,
        event_type: "order_modified",
        event_description: "Order details modified by customer",
        event_data: {
          modified_fields: Object.keys(updateData),
          subtotal: updateData.subtotal,
          total_weight: updateData.totalWeight,
        },
        created_by: "customer",
      })
      console.log("✅ Order modification timeline event added")
    } catch (timelineError) {
      console.warn("Failed to add order modification timeline event:", timelineError)
    }

    return NextResponse.json({
      success: true,
      order: data,
      message: "Order updated successfully",
    })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ success: false, error: "An error occurred while updating the order" }, { status: 500 })
  }
}
