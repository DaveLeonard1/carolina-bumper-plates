import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createSupabaseAdmin()

    // Fetch all paid orders
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_status", "paid")
      .order("paid_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch delivery orders:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch delivery orders" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    })
  } catch (error) {
    console.error("Delivery orders fetch error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching delivery orders" },
      { status: 500 }
    )
  }
}
