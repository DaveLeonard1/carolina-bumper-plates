import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { sendEmail } from "@/lib/email/mailgun"
import { generatePaymentReceiptEmail } from "@/lib/email/payment-receipt-template"

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Get order details with items
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Check if order is paid
    if (order.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Cannot send receipt for unpaid order" },
        { status: 400 }
      )
    }

    // Parse order items
    const orderItems = typeof order.order_items === 'string' 
      ? JSON.parse(order.order_items) 
      : order.order_items || []

    // Calculate total from items if order.total_amount is missing or 0
    let orderTotal = order.total_amount || 0
    if (orderTotal === 0 && orderItems.length > 0) {
      orderTotal = orderItems.reduce((sum: number, item: any) => {
        const price = item.price || item.selling_price || 0
        const quantity = item.quantity || 0
        return sum + (price * quantity)
      }, 0)
      console.log(`📊 Calculated order total from items: $${orderTotal}`)
    }

    // Parse addresses
    const shippingAddress = typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address)
      : order.shipping_address
      
    const billingAddress = typeof order.billing_address === 'string'
      ? JSON.parse(order.billing_address)
      : order.billing_address

    // Parse payment method details
    const paymentMethodDetails = typeof order.payment_method_details === 'string'
      ? JSON.parse(order.payment_method_details)
      : order.payment_method_details

    // Generate and send receipt email
    console.log(`📧 Preparing to send receipt for order ${order.order_number} to ${order.customer_email}`)
    console.log(`💰 Order total: $${orderTotal}`)
    
    const receiptEmail = generatePaymentReceiptEmail({
      customerName: order.customer_name || "Customer",
      orderNumber: order.order_number,
      orderTotal: orderTotal,
      paidAt: order.paid_at || new Date().toISOString(),
      orderItems: orderItems.map((item: any) => ({
        weight: item.weight,
        quantity: item.quantity,
        price: item.price || item.selling_price || 0,
        title: item.title,
      })),
      shippingAddress,
      billingAddress,
      paymentMethod: paymentMethodDetails ? {
        last4: paymentMethodDetails.last4,
        brand: paymentMethodDetails.brand,
      } : undefined,
    })

    console.log(`📤 Email template generated, subject: "${receiptEmail.subject}"`)

    const emailResult = await sendEmail({
      to: order.customer_email,
      subject: receiptEmail.subject,
      html: receiptEmail.html,
    })

    console.log(`📬 Email send result:`, emailResult)

    if (!emailResult.success) {
      console.error("❌ Failed to send receipt email:", emailResult.error)
      
      // Add timeline event for failed email
      try {
        await supabaseAdmin.from("order_timeline").insert({
          order_id: order.id,
          event_type: "email_failed",
          event_description: "Failed to manually resend payment receipt",
          event_data: {
            email_type: "payment_receipt_resend",
            recipient: order.customer_email,
            error: emailResult.error,
          },
          created_by: "admin",
        })
      } catch (timelineError) {
        console.warn("Failed to add timeline event:", timelineError)
      }

      return NextResponse.json(
        { success: false, error: emailResult.error || "Failed to send email" },
        { status: 500 }
      )
    }

    // Add timeline event for successful email
    try {
      await supabaseAdmin.from("order_timeline").insert({
        order_id: order.id,
        event_type: "email_sent",
        event_description: "Payment receipt manually resent by admin",
        event_data: {
          email_type: "payment_receipt_resend",
          recipient: order.customer_email,
          message_id: emailResult.messageId,
        },
        created_by: "admin",
      })
    } catch (timelineError) {
      console.warn("Failed to add timeline event:", timelineError)
    }

    return NextResponse.json({
      success: true,
      message: "Receipt email sent successfully",
      recipient: order.customer_email,
    })
  } catch (error) {
    console.error("Resend receipt error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to resend receipt" },
      { status: 500 }
    )
  }
}
