import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { syncAllProductsWithStripe } from "@/lib/stripe-products-schema-fixed"

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Get all available products
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("available", true)
      .order("weight", { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }

    const syncStatus = {
      total_products: products?.length || 0,
      synced_products: 0,
      products_with_prices: 0,
      active_products: 0,
      products: [],
    }

    if (products) {
      for (const product of products) {
        const productStatus = {
          id: product.id,
          weight: product.weight,
          title: product.title,
          selling_price: product.selling_price,
          has_stripe_product: !!product.stripe_product_id,
          has_stripe_price: !!product.stripe_price_id,
          is_active: !!product.stripe_active,
          last_synced: product.stripe_synced_at,
          ready_for_invoicing: !!(product.stripe_product_id && product.stripe_price_id && product.stripe_active),
        }

        if (productStatus.has_stripe_product) syncStatus.synced_products++
        if (productStatus.has_stripe_price) syncStatus.products_with_prices++
        if (productStatus.is_active) syncStatus.active_products++

        syncStatus.products.push(productStatus)
      }
    }

    return NextResponse.json({
      success: true,
      sync_status: syncStatus,
      recommendations: {
        needs_sync: syncStatus.total_products - syncStatus.synced_products,
        needs_prices: syncStatus.total_products - syncStatus.products_with_prices,
        needs_activation: syncStatus.synced_products - syncStatus.active_products,
      },
    })
  } catch (error) {
    console.error("Stripe sync test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST() {
  try {
    console.log("Starting Stripe product sync...")
    await syncAllProductsWithStripe()

    return NextResponse.json({
      success: true,
      message: "Product sync completed successfully",
    })
  } catch (error) {
    console.error("Stripe sync error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    })
  }
}
