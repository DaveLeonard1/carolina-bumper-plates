import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = createSupabaseAdmin()

    console.log("🔍 Starting comprehensive pricing audit...")

    // Step 1: Check products for pricing issues
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, weight, selling_price, regular_price")
      .order("weight")

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    console.log(`📊 Auditing ${products?.length || 0} products...`)

    // Check for decimal precision issues
    const precisionIssues =
      products?.filter(
        (p) =>
          p.selling_price !== Math.round(p.selling_price * 100) / 100 ||
          p.regular_price !== Math.round(p.regular_price * 100) / 100,
      ) || []

    // Check for invalid savings
    const savingsIssues = products?.filter((p) => p.regular_price <= p.selling_price) || []

    // Check for negative prices
    const negativeIssues = products?.filter((p) => p.selling_price <= 0 || p.regular_price <= 0) || []

    console.log(`❌ Found ${precisionIssues.length} precision issues`)
    console.log(`❌ Found ${savingsIssues.length} savings issues`)
    console.log(`❌ Found ${negativeIssues.length} negative price issues`)

    // Fix precision issues
    if (precisionIssues.length > 0) {
      console.log("🔧 Fixing precision issues...")
      for (const product of precisionIssues) {
        const { error } = await supabase
          .from("products")
          .update({
            selling_price: Math.round(product.selling_price * 100) / 100,
            regular_price: Math.round(product.regular_price * 100) / 100,
          })
          .eq("id", product.id)

        if (error) {
          console.error(`Failed to fix precision for product ${product.id}:`, error)
        }
      }
      console.log("✅ Fixed precision issues")
    }

    // Fix savings issues
    if (savingsIssues.length > 0) {
      console.log("🔧 Fixing savings issues...")
      for (const product of savingsIssues) {
        const newRegularPrice = Math.round(product.selling_price * 1.25 * 100) / 100
        const { error } = await supabase
          .from("products")
          .update({
            regular_price: newRegularPrice,
          })
          .eq("id", product.id)

        if (error) {
          console.error(`Failed to fix savings for product ${product.id}:`, error)
        } else {
          console.log(
            `  - ${product.title}: Regular price updated from $${product.regular_price} to $${newRegularPrice}`,
          )
        }
      }
      console.log("✅ Fixed savings issues")
    }

    // Step 2: First, let's discover what columns actually exist in orders
    console.log("🔍 Discovering actual orders table structure...")

    const { data: sampleOrder, error: sampleError } = await supabase.from("orders").select("*").limit(1)

    if (sampleError) {
      throw new Error(`Failed to fetch sample order: ${sampleError.message}`)
    }

    const availableColumns = sampleOrder && sampleOrder.length > 0 ? Object.keys(sampleOrder[0]) : []
    console.log("Available columns in orders table:", availableColumns)

    // Determine which columns to select based on what's actually available
    const columnsToSelect = ["id", "order_number", "total_amount"]

    // Add optional columns if they exist
    if (availableColumns.includes("items")) columnsToSelect.push("items")
    if (availableColumns.includes("order_items")) columnsToSelect.push("order_items")
    if (availableColumns.includes("products")) columnsToSelect.push("products")
    if (availableColumns.includes("cart_items")) columnsToSelect.push("cart_items")

    console.log("Selecting columns:", columnsToSelect)

    // Now fetch orders with only the columns that exist
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(columnsToSelect.join(", "))
      .order("created_at", { ascending: false })
      .limit(50)

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    console.log(`📊 Auditing ${orders?.length || 0} recent orders...`)

    const orderIssues = []

    // Helper function to find order items in any available format
    const findOrderItems = (order: any): Array<{ weight: number; quantity: number }> => {
      const possibleItemFields = ["items", "order_items", "products", "cart_items"]

      for (const field of possibleItemFields) {
        if (order[field]) {
          try {
            let items = order[field]

            // Handle string-encoded JSON
            if (typeof items === "string") {
              items = JSON.parse(items)
            }

            // Handle single object (wrap in array)
            if (typeof items === "object" && !Array.isArray(items)) {
              items = [items]
            }

            // Ensure it's an array and filter valid items
            if (Array.isArray(items)) {
              const validItems = items.filter(
                (item) => item.weight && item.quantity && item.weight > 0 && item.quantity > 0,
              )

              if (validItems.length > 0) {
                console.log(`Found ${validItems.length} items in field '${field}' for order ${order.order_number}`)
                return validItems
              }
            }
          } catch (error) {
            console.error(`Error parsing ${field} for order ${order.order_number}:`, error)
          }
        }
      }

      return []
    }

    for (const order of orders || []) {
      try {
        // Find items using any available field
        const items = findOrderItems(order)

        if (items.length === 0) {
          console.log(`⚠️  Order ${order.order_number}: No valid items found in any field`)
          continue
        }

        // Calculate total from items
        let calculatedTotal = 0
        let itemsProcessed = 0

        for (const item of items) {
          const product = products?.find((p) => p.weight === item.weight)
          if (product) {
            calculatedTotal += product.selling_price * item.quantity
            itemsProcessed++
          } else {
            console.log(`⚠️  Order ${order.order_number}: Product not found for weight ${item.weight}`)
          }
        }

        if (itemsProcessed === 0) {
          console.log(`⚠️  Order ${order.order_number}: No matching products found`)
          continue
        }

        calculatedTotal = Math.round(calculatedTotal * 100) / 100
        const difference = Math.abs(calculatedTotal - order.total_amount)

        if (difference > 0.01) {
          orderIssues.push({
            id: order.id,
            order_number: order.order_number,
            stored_total: order.total_amount,
            calculated_total: calculatedTotal,
            difference,
          })

          console.log(
            `❌ Order ${order.order_number}: Stored $${order.total_amount}, Calculated $${calculatedTotal} (diff: $${difference.toFixed(2)})`,
          )

          // Fix the order total
          const { error } = await supabase.from("orders").update({ total_amount: calculatedTotal }).eq("id", order.id)

          if (error) {
            console.error(`Failed to fix total for order ${order.order_number}:`, error)
          } else {
            console.log(`✅ Fixed order ${order.order_number} total`)
          }
        }
      } catch (error) {
        console.error(`Error validating order ${order.order_number}:`, error)
      }
    }

    console.log(`❌ Found ${orderIssues.length} order total issues`)
    if (orderIssues.length > 0) {
      console.log("✅ Fixed order total issues")
    }

    // Final summary
    const summary = {
      database_info: {
        available_columns: availableColumns,
        columns_used: columnsToSelect,
      },
      products: {
        total: products?.length || 0,
        precision_issues_fixed: precisionIssues.length,
        savings_issues_fixed: savingsIssues.length,
        negative_price_issues: negativeIssues.length,
      },
      orders: {
        total: orders?.length || 0,
        total_issues_fixed: orderIssues.length,
      },
      all_issues_found: precisionIssues.length + savingsIssues.length + negativeIssues.length + orderIssues.length,
    }

    console.log("🎯 PRICING AUDIT COMPLETED")
    console.log("Summary:", summary)

    return NextResponse.json({
      success: true,
      message: "Pricing audit completed successfully",
      summary,
      details: {
        precision_issues: precisionIssues.map((p) => ({
          id: p.id,
          title: p.title,
          old_selling: p.selling_price,
          new_selling: Math.round(p.selling_price * 100) / 100,
          old_regular: p.regular_price,
          new_regular: Math.round(p.regular_price * 100) / 100,
        })),
        savings_issues: savingsIssues.map((p) => ({
          id: p.id,
          title: p.title,
          selling_price: p.selling_price,
          old_regular: p.regular_price,
          new_regular: Math.round(p.selling_price * 1.25 * 100) / 100,
        })),
        negative_issues: negativeIssues.map((p) => ({
          id: p.id,
          title: p.title,
          selling_price: p.selling_price,
          regular_price: p.regular_price,
        })),
        order_issues: orderIssues,
      },
    })
  } catch (error) {
    console.error("Pricing audit failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Pricing audit failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
