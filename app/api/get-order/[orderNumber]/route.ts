import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    const orderNumber = params.orderNumber

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Order number is required" }, { status: 400 })
    }

    // Check if we can use Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Order lookup is temporarily unavailable" }, { status: 503 })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Check if order can still be modified
    const canModify = !data.invoiced_at && data.status === "pending"

    return NextResponse.json({
      success: true,
      order: {
        ...data,
        canModify,
      },
    })
  } catch (error) {
    console.error("Get order error:", error)
    return NextResponse.json({ success: false, error: "An error occurred while fetching the order" }, { status: 500 })
  }
}
