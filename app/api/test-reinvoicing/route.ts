import { type NextRequest, NextResponse } from "next/server"
import { reinvoiceOrder, getOrderInvoiceHistory } from "@/lib/stripe-invoicing"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Get test order (order 6)
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", "6").single()

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: "Test order not found",
        details: orderError,
      })
    }

    // Check if order is eligible for re-invoicing
    const eligibility = {
      order_id: order.id,
      order_number: order.order_number,
      payment_status: order.payment_status,
      status: order.status,
      reinvoice_count: order.reinvoice_count || 0,
      last_reinvoice_at: order.last_reinvoice_at,
      eligible: order.payment_status !== "paid" && order.status !== "cancelled",
    }

    // Get invoice history
    const historyResult = await getOrderInvoiceHistory(order.id.toString())

    return NextResponse.json({
      success: true,
      message: "Re-invoicing test endpoint ready",
      order_details: eligibility,
      invoice_history: historyResult.history,
      test_instructions: {
        step1: "POST to this endpoint to test re-invoicing",
        step2: "Check the response for success/error details",
        step3: "Verify database updates in orders and order_timeline tables",
      },
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId = "6" } = await request.json()

    console.log(`Testing re-invoicing for order ${orderId}`)

    // Attempt to re-invoice the order
    const result = await reinvoiceOrder(orderId)

    if (result.success) {
      // Get updated order details
      const supabaseAdmin = createSupabaseAdmin()
      const { data: updatedOrder } = await supabaseAdmin
        .from("orders")
        .select("reinvoice_count, last_reinvoice_at, invoice_status, stripe_invoice_id")
        .eq("id", orderId)
        .single()

      return NextResponse.json({
        success: true,
        message: "Re-invoicing test completed successfully",
        invoice_details: result.details,
        updated_order: updatedOrder,
        test_results: {
          stripe_invoice_created: !!result.details?.invoice_id,
          database_updated: !!updatedOrder?.last_reinvoice_at,
          reinvoice_count_incremented: (updatedOrder?.reinvoice_count || 0) > 0,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        test_results: {
          stripe_invoice_created: false,
          database_updated: false,
          error_handled: true,
        },
      })
    }
  } catch (error) {
    console.error("Re-invoicing test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown test error",
    })
  }
}
