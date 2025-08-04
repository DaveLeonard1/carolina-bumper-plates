import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    console.log("🔍 STARTING INVOICE DEBUG for order:", orderId)

    // Step 1: Get order data
    console.log("📋 Step 1: Fetching order data...")
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single()

    if (orderError || !order) {
      console.error("❌ Order fetch failed:", orderError)
      return NextResponse.json({
        success: false,
        error: "Order not found",
        debug: { orderError },
      })
    }

    console.log("✅ Order found:", {
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      order_items_type: typeof order.order_items,
      order_items_length: order.order_items ? JSON.stringify(order.order_items).length : 0,
    })

    // Step 2: Parse order items
    console.log("📦 Step 2: Parsing order items...")
    let parsedItems = []
    let parseError = null

    try {
      if (typeof order.order_items === "string") {
        parsedItems = JSON.parse(order.order_items)
      } else if (Array.isArray(order.order_items)) {
        parsedItems = order.order_items
      } else {
        parseError = "Order items is not string or array"
      }
    } catch (error) {
      parseError = `JSON parse failed: ${error}`
    }

    console.log("📦 Order items parsing result:", {
      success: !parseError,
      error: parseError,
      items_count: parsedItems.length,
      items: parsedItems,
    })

    // Step 3: Extract weights needed
    console.log("⚖️ Step 3: Extracting product weights...")
    const weightsNeeded = parsedItems.map((item) => item.weight).filter(Boolean)
    console.log("⚖️ Weights needed:", weightsNeeded)

    // Step 4: Find matching products
    console.log("🔍 Step 4: Finding matching products...")
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("weight", weightsNeeded)
      .eq("available", true)

    console.log("🔍 Products query result:", {
      success: !productsError,
      error: productsError,
      products_found: products?.length || 0,
      products: products?.map((p) => ({
        id: p.id,
        title: p.title,
        weight: p.weight,
        selling_price: p.selling_price,
        has_stripe_product: !!p.stripe_product_id,
        has_stripe_price: !!p.stripe_price_id,
      })),
    })

    // Step 5: Check Stripe sync status
    console.log("💳 Step 5: Checking Stripe sync status...")
    const stripeReadyProducts = products?.filter((p) => p.stripe_product_id && p.stripe_price_id) || []

    console.log("💳 Stripe ready products:", stripeReadyProducts.length)

    // Step 6: Simulate invoice item creation
    console.log("📄 Step 6: Simulating invoice item creation...")
    const invoiceItemsSimulation = []

    for (const orderItem of parsedItems) {
      const matchingProduct = products?.find((p) => p.weight === orderItem.weight)

      if (matchingProduct) {
        if (matchingProduct.stripe_price_id) {
          invoiceItemsSimulation.push({
            weight: orderItem.weight,
            quantity: orderItem.quantity,
            product_title: matchingProduct.title,
            stripe_price_id: matchingProduct.stripe_price_id,
            unit_amount: matchingProduct.stripe_price_amount || matchingProduct.selling_price * 100,
            status: "✅ Ready for Stripe",
          })
        } else {
          invoiceItemsSimulation.push({
            weight: orderItem.weight,
            quantity: orderItem.quantity,
            product_title: matchingProduct.title,
            stripe_price_id: null,
            unit_amount: matchingProduct.selling_price * 100,
            status: "⚠️ Needs Stripe sync",
          })
        }
      } else {
        invoiceItemsSimulation.push({
          weight: orderItem.weight,
          quantity: orderItem.quantity,
          product_title: `${orderItem.weight}lb Bumper Plate`,
          stripe_price_id: null,
          unit_amount: null,
          status: "❌ Product not found",
        })
      }
    }

    console.log("📄 Invoice items simulation:", invoiceItemsSimulation)

    // Return comprehensive debug information
    return NextResponse.json({
      success: true,
      debug: {
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_email: order.customer_email,
          subtotal: order.subtotal,
          status: order.status,
        },
        order_items_parsing: {
          success: !parseError,
          error: parseError,
          raw_type: typeof order.order_items,
          parsed_count: parsedItems.length,
          items: parsedItems,
        },
        product_matching: {
          weights_needed: weightsNeeded,
          products_found: products?.length || 0,
          stripe_ready: stripeReadyProducts.length,
          products: products?.map((p) => ({
            id: p.id,
            title: p.title,
            weight: p.weight,
            selling_price: p.selling_price,
            stripe_product_id: p.stripe_product_id,
            stripe_price_id: p.stripe_price_id,
            stripe_active: p.stripe_active,
          })),
        },
        invoice_simulation: {
          items: invoiceItemsSimulation,
          ready_items: invoiceItemsSimulation.filter((i) => i.status === "✅ Ready for Stripe").length,
          total_items: invoiceItemsSimulation.length,
        },
        recommendations: [
          parsedItems.length === 0 ? "❌ Fix order items parsing" : "✅ Order items parsed successfully",
          products?.length === 0 ? "❌ No matching products found" : "✅ Products found in database",
          stripeReadyProducts.length === 0 ? "❌ No products synced with Stripe" : "✅ Some products ready for Stripe",
          invoiceItemsSimulation.filter((i) => i.status === "✅ Ready for Stripe").length === 0
            ? "❌ No items ready for invoice creation"
            : "✅ Some items ready for invoicing",
        ],
      },
    })
  } catch (error) {
    console.error("💥 Debug process failed:", error)
    return NextResponse.json({
      success: false,
      error: "Debug process failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
