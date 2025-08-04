import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { auditProductPricing, validateOrderTotal } from "@/lib/pricing-audit"

export async function GET() {
  try {
    const supabase = createSupabaseAdmin()

    // Audit all products
    const { data: products, error: productsError } = await supabase.from("products").select("*").order("weight")

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    // Audit all orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, items")
      .order("created_at", { ascending: false })
      .limit(100) // Limit for performance

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    // Audit products
    const productAudits =
      products?.map((product) => ({
        id: product.id,
        title: product.title,
        weight: product.weight,
        audit: auditProductPricing(product),
      })) || []

    // Audit orders
    const orderAudits = []
    for (const order of orders || []) {
      try {
        let items = []
        if (order.items) {
          // Parse items (handle different formats)
          if (typeof order.items === "string") {
            items = JSON.parse(order.items)
          } else {
            items = Array.isArray(order.items) ? order.items : [order.items]
          }

          // Get product prices for validation
          const itemsWithPrices = await Promise.all(
            items.map(async (item: any) => {
              const { data: product } = await supabase
                .from("products")
                .select("selling_price")
                .eq("weight", item.weight)
                .single()

              return {
                ...item,
                price: product?.selling_price || 0,
              }
            }),
          )

          const validation = validateOrderTotal(itemsWithPrices, order.total_amount)

          orderAudits.push({
            id: order.id,
            order_number: order.order_number,
            validation,
          })
        }
      } catch (error) {
        orderAudits.push({
          id: order.id,
          order_number: order.order_number,
          validation: {
            calculatedTotal: 0,
            storedTotal: order.total_amount,
            difference: order.total_amount,
            isAccurate: false,
            items: [],
            error: `Failed to validate: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        })
      }
    }

    // Calculate summary statistics
    const productIssues = productAudits.filter((p) => !p.audit.isValid)
    const orderIssues = orderAudits.filter((o) => !o.validation.isAccurate)

    const summary = {
      products: {
        total: productAudits.length,
        valid: productAudits.length - productIssues.length,
        issues: productIssues.length,
        criticalIssues: productIssues.filter((p) => p.audit.severity === "high").length,
      },
      orders: {
        total: orderAudits.length,
        accurate: orderAudits.length - orderIssues.length,
        issues: orderIssues.length,
        totalDiscrepancy: orderIssues.reduce((sum, o) => sum + (o.validation.difference || 0), 0),
      },
    }

    return NextResponse.json({
      success: true,
      summary,
      productAudits,
      orderAudits: orderAudits.slice(0, 20), // Limit response size
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Pricing audit error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform pricing audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
