import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripe } from "@/lib/stripe"

export async function GET() {
  try {
    console.log("🔍 Starting sync process investigation...")

    const supabaseAdmin = createSupabaseAdmin()
    const stripe = await getStripe()

    // Get all products from database
    const { data: dbProducts, error: dbError } = await supabaseAdmin.from("products").select("*").order("weight")

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    const investigation = []

    for (const product of dbProducts || []) {
      const productInfo: any = {
        database_id: product.id,
        database_title: product.title,
        database_weight: product.weight,
        database_price: product.selling_price,
        stripe_product_id: product.stripe_product_id,
        stripe_price_id: product.stripe_price_id,
        last_synced: product.stripe_synced_at,
        sync_status: "unknown",
        stripe_data: null,
        issues: [],
      }

      // Check if product has Stripe IDs
      if (!product.stripe_product_id) {
        productInfo.sync_status = "never_synced"
        productInfo.issues.push("No Stripe product ID - product never synced")
      } else {
        try {
          // Fetch current Stripe product data
          const stripeProduct = await stripe.products.retrieve(product.stripe_product_id)

          productInfo.stripe_data = {
            id: stripeProduct.id,
            name: stripeProduct.name,
            description: stripeProduct.description,
            active: stripeProduct.active,
            metadata: stripeProduct.metadata,
            updated: stripeProduct.updated,
          }

          // Compare database vs Stripe data
          if (stripeProduct.name !== product.title) {
            productInfo.sync_status = "out_of_sync"
            productInfo.issues.push(`Name mismatch: DB="${product.title}" vs Stripe="${stripeProduct.name}"`)
          } else {
            productInfo.sync_status = "in_sync"
          }

          // Check metadata consistency
          if (stripeProduct.metadata?.weight !== product.weight?.toString()) {
            productInfo.issues.push(
              `Weight metadata mismatch: DB="${product.weight}" vs Stripe="${stripeProduct.metadata?.weight}"`,
            )
          }

          if (stripeProduct.metadata?.selling_price !== product.selling_price?.toString()) {
            productInfo.issues.push(
              `Price metadata mismatch: DB="${product.selling_price}" vs Stripe="${stripeProduct.metadata?.selling_price}"`,
            )
          }
        } catch (stripeError: any) {
          productInfo.sync_status = "stripe_error"
          productInfo.issues.push(`Stripe error: ${stripeError.message}`)
        }
      }

      investigation.push(productInfo)
    }

    // Summary statistics
    const summary = {
      total_products: investigation.length,
      never_synced: investigation.filter((p) => p.sync_status === "never_synced").length,
      in_sync: investigation.filter((p) => p.sync_status === "in_sync").length,
      out_of_sync: investigation.filter((p) => p.sync_status === "out_of_sync").length,
      stripe_errors: investigation.filter((p) => p.sync_status === "stripe_error").length,
      products_with_issues: investigation.filter((p) => p.issues.length > 0).length,
    }

    return NextResponse.json({
      success: true,
      summary,
      investigation,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in sync investigation:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
