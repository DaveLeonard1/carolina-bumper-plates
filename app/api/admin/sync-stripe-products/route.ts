import { NextResponse } from "next/server"
import { checkSyncHealth, getAllProductsWithSyncStatus, syncAllProductsWithStripe } from "@/lib/stripe-products-fixed"

export async function GET() {
  try {
    console.log("🔍 Starting Stripe products health check...")

    const health = await checkSyncHealth()
    const products = await getAllProductsWithSyncStatus()

    const productStatus = products.map((product) => ({
      id: product.id,
      title: product.title,
      weight: product.weight,
      selling_price: product.selling_price,
      regular_price: product.regular_price,
      stripe_synced: !!(product.stripe_product_id && product.stripe_price_id),
      stripe_product_id: product.stripe_product_id,
      stripe_price_id: product.stripe_price_id,
      stripe_price_amount: product.stripe_price_amount,
      last_synced: product.stripe_synced_at,
      active: product.available,
      has_image: !!product.image_url,
      price_matches: product.stripe_price_amount === Math.round((product.selling_price || 0) * 100),
    }))

    const syncedCount = productStatus.filter((p) => p.stripe_synced).length
    const priceMatchCount = productStatus.filter((p) => p.price_matches).length

    return NextResponse.json({
      success: health.issues.length === 0,
      products: productStatus,
      total_products: products.length,
      synced_products: syncedCount,
      unsynced_products: products.length - syncedCount,
      price_matches: priceMatchCount,
      price_mismatches: syncedCount - priceMatchCount,
      database_ready: health.databaseReady,
      stripe_configured: health.stripeConfigured,
      tax_code: health.taxCode,
      issues: health.issues,
      debug_info: {
        columnInfo: health.columnInfo,
        message: `${products.length} products (${syncedCount} synced, ${priceMatchCount} prices match) - Tax Code: ${health.taxCode}`,
      },
    })
  } catch (error) {
    console.error("❌ Error in sync-stripe-products GET:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        products: [],
        total_products: 0,
        synced_products: 0,
        unsynced_products: 0,
        price_matches: 0,
        price_mismatches: 0,
        database_ready: false,
        stripe_configured: false,
        tax_code: "txcd_99999999",
        issues: ["Failed to check system health"],
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    console.log("🚀 Starting Stripe products sync with duplicate prevention...")

    const health = await checkSyncHealth()

    if (!health.databaseReady) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not ready for sync - Stripe columns missing",
          issues: health.issues,
        },
        { status: 400 },
      )
    }

    if (!health.stripeConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe not configured properly",
          issues: health.issues,
        },
        { status: 400 },
      )
    }

    const result = await syncAllProductsWithStripe(false) // Don't force update by default

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.succeeded} products (${result.reused} prices reused, ${result.skipped} unchanged)`,
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        created: result.created,
        updated: result.updated,
        reused: result.reused,
        skipped: result.skipped,
        tax_code: health.taxCode,
        errors: result.errors,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Sync completed with errors: ${result.failed} failed`,
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          created: result.created,
          updated: result.updated,
          reused: result.reused,
          skipped: result.skipped,
          tax_code: health.taxCode,
          errors: result.errors,
        },
        { status: 207 },
      )
    }
  } catch (error) {
    console.error("❌ Error in sync-stripe-products POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processed: 0,
        succeeded: 0,
        failed: 0,
        created: 0,
        updated: 0,
        reused: 0,
        skipped: 0,
        tax_code: "txcd_99999999",
        errors: [{ productId: "system", error: "Critical sync failure" }],
      },
      { status: 500 },
    )
  }
}
