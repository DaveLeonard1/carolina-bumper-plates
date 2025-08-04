import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { createStripeInvoiceForOrder } from "@/lib/stripe-invoicing-complete-fix"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Get order details with proper error handling
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      console.error("Order fetch error:", orderError)
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Check if order can be invoiced
    if (order.status !== "pending") {
      return NextResponse.json({ success: false, error: "Only pending orders can be invoiced" }, { status: 400 })
    }

    // Check if invoice already exists
    if (order.stripe_invoice_id) {
      return NextResponse.json({ success: false, error: "Invoice already exists for this order" }, { status: 400 })
    }

    // Create Stripe invoice using the fixed library
    const invoiceResult = await createStripeInvoiceForOrder(order, false)

    if (invoiceResult.success && invoiceResult.details) {
      // Update order with new invoice information
      const updateData = {
        stripe_customer_id: invoiceResult.details.customer_id,
        stripe_invoice_id: invoiceResult.details.invoice_id,
        stripe_invoice_url: invoiceResult.details.invoice_url,
        stripe_invoice_pdf: invoiceResult.details.invoice_pdf,
        status: "invoiced",
        invoice_status: "sent",
        payment_status: "unpaid",
        invoice_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabaseAdmin.from("orders").update(updateData).eq("id", orderId)

      if (updateError) {
        console.error("Order update error:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 })
      }

      // Add timeline event
      await supabaseAdmin.from("order_timeline").insert([
        {
          order_id: Number.parseInt(orderId),
          event_type: "stripe_invoice_created",
          event_description: `Stripe invoice created and sent to customer`,
          event_data: {
            stripe_invoice_id: invoiceResult.details.invoice_id,
            stripe_customer_id: invoiceResult.details.customer_id,
            invoice_url: invoiceResult.details.invoice_url,
          },
          created_by: "admin",
          created_at: new Date().toISOString(),
        },
      ])

      return NextResponse.json({
        success: true,
        message: "Invoice created and sent successfully",
        invoice: {
          id: invoiceResult.details.invoice_id,
          url: invoiceResult.details.invoice_url,
          pdf: invoiceResult.details.invoice_pdf,
          customer_id: invoiceResult.details.customer_id,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: invoiceResult.error || "Failed to create invoice",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Stripe invoice creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create invoice",
      },
      { status: 500 },
    )
  }
}
