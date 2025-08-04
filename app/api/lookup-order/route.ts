import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { orderNumber, email } = await request.json()

    if (!orderNumber || !email) {
      return NextResponse.json({ success: false, error: "Order number and email are required" }, { status: 400 })
    }

    // Check if we can use Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Order lookup is temporarily unavailable. Please contact support." },
        { status: 503 },
      )
    }

    // Try to find the order
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.toUpperCase())
      .eq("customer_email", email.toLowerCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Order not found. Please check your order number and email address." },
        { status: 404 },
      )
    }

    // Check if order can still be modified
    const canModify = !data.invoiced_at && data.status === "pending"

    return NextResponse.json({
      success: true,
      order: data,
      canModify,
    })
  } catch (error) {
    console.error("Order lookup error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while looking up your order" },
      { status: 500 },
    )
  }
}
