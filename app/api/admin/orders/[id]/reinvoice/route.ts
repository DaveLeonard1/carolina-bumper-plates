import { type NextRequest, NextResponse } from "next/server"
import { reinvoiceOrder } from "@/lib/stripe-invoicing-fixed"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    console.log("Re-invoice API called for order:", orderId)

    // Attempt to re-invoice the order
    const result = await reinvoiceOrder(orderId)

    if (result.success) {
      console.log("Re-invoice successful:", result.details)
      return NextResponse.json({
        success: true,
        message: "Order re-invoiced successfully",
        invoice: {
          id: result.details?.invoice_id,
          url: result.details?.invoice_url,
          pdf: result.details?.invoice_pdf,
        },
      })
    } else {
      console.error("Re-invoice failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to re-invoice order",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Re-invoice API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during re-invoicing",
      },
      { status: 500 },
    )
  }
}
