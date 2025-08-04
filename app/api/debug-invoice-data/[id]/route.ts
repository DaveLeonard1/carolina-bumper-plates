import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    const supabaseAdmin = createSupabaseAdmin()

    // Get order details with all fields
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" })
    }

    // Parse order items if they're stored as JSON
    let orderItems = []
    try {
      if (typeof order.order_items === "string") {
        orderItems = JSON.parse(order.order_items)
      } else if (Array.isArray(order.order_items)) {
        orderItems = order.order_items
      }
    } catch (e) {
      console.error("Failed to parse order items:", e)
    }

    // Get unique weights from order items
    const weights = orderItems.length > 0 ? [...new Set(orderItems.map((item: any) => item.weight))] : []

    // Fetch products with Stripe information
    let products = []
    if (weights.length > 0) {
      const { data: productsData, error: productsError } = await supabaseAdmin
        .from("products")
        .select("weight, title, stripe_product_id, stripe_price_id, selling_price, available")
        .in("weight", weights)

      if (productsError) {
        console.error("Products fetch error:", productsError)
      } else {
        products = productsData || []
      }
    }

    // Create product mapping
    const productMap = new Map()
    products.forEach((product: any) => {
      productMap.set(product.weight, product)
    })

    // Analyze order items with product mapping
    const analyzedItems = orderItems.map((item: any) => {
      const product = productMap.get(item.weight)
      return {
        orderItem: item,
        product: product || null,
        hasStripePrice: !!product?.stripe_price_id,
        hasStripeProduct: !!product?.stripe_product_id,
        calculatedUnitAmount: item.quantity > 0 ? Math.round((item.price / item.quantity) * 100) : 0,
      }
    })

    return NextResponse.json({
      success: true,
      debug: {
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          street_address: order.street_address,
          city: order.city,
          state: order.state,
          zip_code: order.zip_code,
          subtotal: order.subtotal,
          total_weight: order.total_weight,
          status: order.status,
          payment_status: order.payment_status,
        },
        orderItems: {
          raw: order.order_items,
          parsed: orderItems,
          count: orderItems.length,
        },
        products: {
          weights: weights,
          found: products,
          mapping: Object.fromEntries(productMap),
        },
        analysis: analyzedItems,
        issues: {
          noOrderItems: orderItems.length === 0,
          noProducts: products.length === 0,
          missingStripeData: analyzedItems.filter((item) => !item.hasStripePrice && !item.hasStripeProduct).length,
          missingAddress: !order.street_address || !order.city || !order.state || !order.zip_code,
        },
      },
    })
  } catch (error) {
    console.error("Debug invoice data error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
