import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const orderId = params.id

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
          debug: { orderError, orderId },
        },
        { status: 404 },
      )
    }

    // Get all products for debugging
    const { data: allProducts, error: allProductsError } = await supabaseAdmin
      .from("products")
      .select("id, weight, image_url, title, name, available")
      .order("weight")

    // Extract order item weights
    const orderItems = order.order_items || []
    const weights = orderItems.map((item) => item.weight)
    const uniqueWeights = [...new Set(weights)]

    // Get products matching order weights
    const { data: matchingProducts, error: matchingError } = await supabaseAdmin
      .from("products")
      .select("weight, image_url, title, name, available")
      .in("weight", uniqueWeights)

    return NextResponse.json({
      success: true,
      debug: {
        orderId,
        orderItems,
        weights,
        uniqueWeights,
        allProducts: allProducts || [],
        matchingProducts: matchingProducts || [],
        allProductsError,
        matchingError,
        productsTableExists: !allProductsError,
        imageUrlsFound: (matchingProducts || []).filter((p) => p.image_url).length,
      },
    })
  } catch (error) {
    console.error("Debug order images error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        debug: { error: error.message },
      },
      { status: 500 },
    )
  }
}
