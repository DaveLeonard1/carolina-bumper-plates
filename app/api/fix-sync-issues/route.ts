import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripe } from "@/lib/stripe"
import { getStripeConfig } from "@/lib/stripe-config"

interface FixResult {
  product_id: string
  actions_taken: string[]
  success: boolean
  error?: string
}

export async function POST() {
  try {
    console.log("🔧 Starting comprehensive sync fix...")

    const supabaseAdmin = createSupabaseAdmin()
    const stripe = await getStripe()
    const config = await getStripeConfig()

    // Get all products that need fixing
    const { data: products, error: dbError } = await supabaseAdmin
      .from("products")
      .select("*")
      .not("stripe_product_id", "is", null)
      .order("id")

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    const results: FixResult[] = []
    let totalFixed = 0

    for (const product of products || []) {
      const result: FixResult = {
        product_id: product.id.toString(),
        actions_taken: [],
        success: false,
      }

      try {
        console.log(`🔄 Processing product: ${product.title} (ID: ${product.id})`)

        // Get current Stripe product
        const stripeProduct = await stripe.products.retrieve(product.stripe_product_id)

        const updates: any = {}
        let needsUpdate = false

        // Fix name mismatch
        if (stripeProduct.name !== product.title) {
          updates.name = product.title
          needsUpdate = true
          result.actions_taken.push(`Updated name: "${stripeProduct.name}" → "${product.title}"`)
        }

        // Fix description
        const expectedDescription = product.description || `Hi-Temp ${product.weight}lb Bumper Plate - Factory Second`
        if (stripeProduct.description !== expectedDescription) {
          updates.description = expectedDescription
          needsUpdate = true
          result.actions_taken.push("Updated description")
        }

        // Fix metadata
        const currentMetadata = stripeProduct.metadata || {}
        const newMetadata = {
          ...currentMetadata,
          weight: product.weight?.toString() || "",
          selling_price: product.selling_price?.toString() || "",
          regular_price: product.regular_price?.toString() || "",
          product_id: product.id.toString(),
          last_updated: new Date().toISOString(),
        }

        if (JSON.stringify(currentMetadata) !== JSON.stringify(newMetadata)) {
          updates.metadata = newMetadata
          needsUpdate = true
          result.actions_taken.push("Updated metadata")
        }

        // Fix tax code
        const defaultTaxCode = config.default_tax_code || "txcd_20030000" // Sporting goods
        if (!stripeProduct.tax_code || stripeProduct.tax_code === "txcd_99999999") {
          updates.tax_code = defaultTaxCode
          needsUpdate = true
          result.actions_taken.push(`Set tax code: ${defaultTaxCode}`)
        }

        // Apply updates if needed
        if (needsUpdate) {
          console.log(`📝 Updating Stripe product ${product.stripe_product_id}:`, updates)
          await stripe.products.update(product.stripe_product_id, updates)

          // Update database sync timestamp
          await supabaseAdmin
            .from("products")
            .update({
              stripe_synced_at: new Date().toISOString(),
            })
            .eq("id", product.id)

          result.actions_taken.push("Updated database sync timestamp")
          totalFixed++
        } else {
          result.actions_taken.push("No updates needed - already in sync")
        }

        // Check and fix price if needed
        if (product.stripe_price_id) {
          try {
            const currentPrice = await stripe.prices.retrieve(product.stripe_price_id)
            const expectedAmount = Math.round(product.selling_price * 100)

            if (currentPrice.unit_amount !== expectedAmount) {
              // Create new price (Stripe prices are immutable)
              const newPrice = await stripe.prices.create({
                product: product.stripe_product_id,
                unit_amount: expectedAmount,
                currency: "usd",
                tax_behavior: "exclusive",
                metadata: {
                  weight: product.weight?.toString() || "",
                  selling_price: product.selling_price?.toString() || "",
                  product_id: product.id.toString(),
                  created_at: new Date().toISOString(),
                },
              })

              // Update database with new price ID
              await supabaseAdmin
                .from("products")
                .update({
                  stripe_price_id: newPrice.id,
                  stripe_synced_at: new Date().toISOString(),
                })
                .eq("id", product.id)

              result.actions_taken.push(
                `Created new price: $${product.selling_price} (was $${(currentPrice.unit_amount || 0) / 100})`,
              )
            }
          } catch (priceError) {
            result.actions_taken.push(`Price check failed: ${priceError}`)
          }
        }

        result.success = true
        console.log(`✅ Successfully processed product ${product.title}`)
      } catch (error) {
        result.success = false
        result.error = error instanceof Error ? error.message : "Unknown error"
        console.error(`❌ Failed to process product ${product.title}:`, error)
      }

      results.push(result)
    }

    console.log(`🎉 Sync fix complete: ${totalFixed} products updated`)

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.length} products, ${totalFixed} updated`,
      results,
      summary: {
        total_processed: results.length,
        successful_fixes: results.filter((r) => r.success).length,
        failed_fixes: results.filter((r) => !r.success).length,
        products_updated: totalFixed,
      },
    })
  } catch (error) {
    console.error("❌ Comprehensive sync fix failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Fix operation failed",
      },
      { status: 500 },
    )
  }
}
