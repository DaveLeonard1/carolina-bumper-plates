import { type NextRequest, NextResponse } from "next/server"
import { getOrderInvoiceHistory } from "@/lib/stripe-invoicing"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const result = await getOrderInvoiceHistory(orderId)

    return NextResponse.json({
      success: result.success,
      history: result.history,
      error: result.error,
    })
  } catch (error) {
    console.error("Invoice history API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error fetching invoice history",
        history: [],
      },
      { status: 500 },
    )
  }
}
