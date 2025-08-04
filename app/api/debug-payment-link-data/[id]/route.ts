import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    const supabase = createSupabaseAdmin()

    console.log("=== PAYMENT LINK DEBUG START ===")
    console.log("Order ID:", orderId)

    // 1. Check if order exists
    const { data: orderExists, error: orderExistsError } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("id", orderId)
      .single()

    // 2. Get order with all data
    const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    // 3. Try to get order with customer join
    const { data: orderWithCustomer, error: joinError } = await supabase
      .from("orders")
      .select(`
        *,
        customers (
          id,
          email,
          first_name,
          last_name,
          stripe_customer_id
        )
      `)
      .eq("id", orderId)
      .single()

    // 4. Check customers table structure
    const { data: customersTableInfo, error: tableError } = await supabase
      .rpc("get_table_info", { table_name: "customers" })
      .catch(() => ({ data: null, error: "RPC not available" }))

    // 5. Look for customer by email if order exists
    let customerLookup = null
    if (orderData?.customer_email) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("email", orderData.customer_email)
        .single()

      customerLookup = { data: customer, error: customerError }
    }

    // 6. Get products for order items
    let productsData = null
    if (orderData?.order_items) {
      try {
        let orderItems
        if (typeof orderData.order_items === "string") {
          orderItems = JSON.parse(orderData.order_items)
        } else {
          orderItems = orderData.order_items
        }

        if (Array.isArray(orderItems) && orderItems.length > 0) {
          const weights = orderItems.map((item) => item.weight)
          const { data: products, error: productsError } = await supabase
            .from("products")
            .select("weight, stripe_price_id, stripe_product_id, title, selling_price")
            .in("weight", weights)

          productsData = { data: products, error: productsError, weights }
        }
      } catch (parseError) {
        productsData = { error: "Failed to parse order items", parseError }
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      orderId,

      // Order existence check
      orderExists: {
        found: !!orderExists,
        error: orderExistsError?.message,
        data: orderExists,
      },

      // Basic order data
      orderData: {
        found: !!orderData,
        error: orderError?.message,
        hasOrderItems: !!orderData?.order_items,
        orderItemsType: typeof orderData?.order_items,
        customerEmail: orderData?.customer_email,
        customerName: orderData?.customer_name,
        status: orderData?.status,
        paymentStatus: orderData?.payment_status,
      },

      // Order with customer join
      orderWithCustomerJoin: {
        found: !!orderWithCustomer,
        error: joinError?.message,
        hasCustomerData: !!orderWithCustomer?.customers,
        customerJoinData: orderWithCustomer?.customers,
      },

      // Customer lookup by email
      customerLookup: {
        attempted: !!orderData?.customer_email,
        found: !!customerLookup?.data,
        error: customerLookup?.error?.message,
        data: customerLookup?.data,
      },

      // Products data
      productsData,

      // Table structure info
      customersTableInfo: {
        available: !!customersTableInfo,
        error: tableError,
        data: customersTableInfo,
      },

      // Environment check
      environment: {
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      },
    }

    console.log("Debug info collected:", debugInfo)
    console.log("=== PAYMENT LINK DEBUG END ===")

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Debug failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
