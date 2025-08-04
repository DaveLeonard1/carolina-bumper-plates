import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripe } from "@/lib/stripe"
import { getStripeConfig } from "@/lib/stripe-config"

interface ProductAnalysis {
  database_product: any
  stripe_product: any
  stripe_prices: any[]
  sync_issues: string[]
  tax_code_info: {
    current_tax_code?: string
    expected_tax_code?: string
    tax_code_source: string
    needs_update: boolean
  }
  last_database_update?: string
  last_stripe_update?: string
  sync_recommendations: string[]
}

interface TaxCodeAnalysis {
  current_setting: string
  location: string
  can_be_automated: boolean
  manual_steps_required: string[]
  stripe_tax_codes: any[]
}

export async function GET() {
  try {
    console.log("🔍 Starting comprehensive sync analysis...")

    const supabaseAdmin = createSupabaseAdmin()
    const stripe = await getStripe()
    const config = await getStripeConfig()

    // Get all products from database
    const { data: dbProducts, error: dbError } = await supabaseAdmin.from("products").select("*").order("id")

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log(`📦 Found ${dbProducts?.length || 0} products in database`)

    const analysis: ProductAnalysis[] = []
    const taxCodeAnalysis: TaxCodeAnalysis = {
      current_setting: "Not configured",
      location: "Unknown",
      can_be_automated: false,
      manual_steps_required: [],
      stripe_tax_codes: [],
    }

    // Analyze tax code configuration
    try {
      const taxCodes = await stripe.taxCodes.list({ limit: 10 })
      taxCodeAnalysis.stripe_tax_codes = taxCodes.data
      console.log(`💰 Found ${taxCodes.data.length} tax codes in Stripe`)
    } catch (taxError) {
      console.warn("⚠️ Could not retrieve tax codes:", taxError)
    }

    // Analyze each product
    for (const dbProduct of dbProducts || []) {
      const productAnalysis: ProductAnalysis = {
        database_product: dbProduct,
        stripe_product: null,
        stripe_prices: [],
        sync_issues: [],
        tax_code_info: {
          tax_code_source: "Not configured",
          needs_update: false,
        },
        sync_recommendations: [],
      }

      try {
        // Get Stripe product if it exists
        if (dbProduct.stripe_product_id) {
          try {
            const stripeProduct = await stripe.products.retrieve(dbProduct.stripe_product_id)
            productAnalysis.stripe_product = stripeProduct
            productAnalysis.last_stripe_update = new Date(stripeProduct.updated * 1000).toISOString()

            // Compare names
            if (stripeProduct.name !== dbProduct.title) {
              productAnalysis.sync_issues.push(
                `Name mismatch: DB="${dbProduct.title}" vs Stripe="${stripeProduct.name}"`,
              )
              productAnalysis.sync_recommendations.push("Update Stripe product name")
            }

            // Compare descriptions
            const expectedDescription =
              dbProduct.description || `Hi-Temp ${dbProduct.weight}lb Bumper Plate - Factory Second`
            if (stripeProduct.description !== expectedDescription) {
              productAnalysis.sync_issues.push(
                `Description mismatch: Expected="${expectedDescription}" vs Stripe="${stripeProduct.description}"`,
              )
              productAnalysis.sync_recommendations.push("Update Stripe product description")
            }

            // Check metadata consistency
            const metadata = stripeProduct.metadata || {}
            if (metadata.weight !== dbProduct.weight?.toString()) {
              productAnalysis.sync_issues.push(
                `Weight metadata mismatch: DB=${dbProduct.weight} vs Stripe=${metadata.weight}`,
              )
            }

            if (metadata.selling_price !== dbProduct.selling_price?.toString()) {
              productAnalysis.sync_issues.push(
                `Price metadata mismatch: DB=${dbProduct.selling_price} vs Stripe=${metadata.selling_price}`,
              )
            }

            // Analyze tax code
            if (stripeProduct.tax_code) {
              productAnalysis.tax_code_info.current_tax_code = stripeProduct.tax_code
              productAnalysis.tax_code_info.tax_code_source = "Stripe product"

              if (stripeProduct.tax_code === "txcd_99999999") {
                productAnalysis.tax_code_info.needs_update = true
                productAnalysis.sync_recommendations.push("Update tax code from default")
              }
            } else {
              productAnalysis.tax_code_info.needs_update = true
              productAnalysis.sync_recommendations.push("Add tax code to product")
            }

            // Get associated prices
            try {
              const prices = await stripe.prices.list({
                product: stripeProduct.id,
                limit: 10,
              })
              productAnalysis.stripe_prices = prices.data

              // Check if current price matches
              const currentPrice = prices.data.find((p) => p.id === dbProduct.stripe_price_id)
              if (!currentPrice) {
                productAnalysis.sync_issues.push("Current price ID not found in Stripe")
                productAnalysis.sync_recommendations.push("Create new price or update price reference")
              } else {
                const expectedAmount = Math.round(dbProduct.selling_price * 100)
                if (currentPrice.unit_amount !== expectedAmount) {
                  productAnalysis.sync_issues.push(
                    `Price mismatch: DB=$${dbProduct.selling_price} vs Stripe=$${(currentPrice.unit_amount || 0) / 100}`,
                  )
                  productAnalysis.sync_recommendations.push("Create new price with correct amount")
                }
              }
            } catch (priceError) {
              productAnalysis.sync_issues.push(`Could not retrieve prices: ${priceError}`)
            }
          } catch (stripeError) {
            productAnalysis.sync_issues.push(`Stripe product not accessible: ${stripeError}`)
            productAnalysis.sync_recommendations.push("Re-create product in Stripe")
          }
        } else {
          productAnalysis.sync_issues.push("Product not synced to Stripe")
          productAnalysis.sync_recommendations.push("Create product in Stripe")
        }

        // Check database timestamps
        if (dbProduct.updated_at) {
          productAnalysis.last_database_update = dbProduct.updated_at
        }
      } catch (error) {
        productAnalysis.sync_issues.push(`Analysis error: ${error}`)
      }

      analysis.push(productAnalysis)
    }

    // Determine tax code configuration location
    try {
      // Check if tax code is in stripe config
      if (config.default_tax_code) {
        taxCodeAnalysis.current_setting = config.default_tax_code
        taxCodeAnalysis.location = "Application configuration (stripe_settings table)"
        taxCodeAnalysis.can_be_automated = true
      } else {
        taxCodeAnalysis.location = "Must be set manually in Stripe or application"
        taxCodeAnalysis.can_be_automated = true
        taxCodeAnalysis.manual_steps_required = [
          "Add default_tax_code to stripe_settings table",
          "Or set tax_code on individual products in Stripe",
          "Use appropriate tax code for physical goods (e.g., txcd_20030000 for sporting goods)",
        ]
      }
    } catch (configError) {
      console.warn("Could not analyze tax code configuration:", configError)
    }

    // Generate summary statistics
    const summary = {
      total_products: analysis.length,
      products_with_issues: analysis.filter((a) => a.sync_issues.length > 0).length,
      products_never_synced: analysis.filter((a) => !a.stripe_product).length,
      products_with_name_issues: analysis.filter((a) => a.sync_issues.some((issue) => issue.includes("Name mismatch")))
        .length,
      products_with_price_issues: analysis.filter((a) =>
        a.sync_issues.some((issue) => issue.includes("Price mismatch")),
      ).length,
      products_needing_tax_code: analysis.filter((a) => a.tax_code_info.needs_update).length,
    }

    console.log("📊 Analysis complete:", summary)

    return NextResponse.json({
      success: true,
      analysis,
      tax_code_analysis: taxCodeAnalysis,
      summary,
      recommendations: {
        immediate_actions: [
          "Run comprehensive product sync with force update",
          "Configure default tax code in application",
          "Verify Stripe API permissions include product updates",
        ],
        long_term_improvements: [
          "Implement automatic sync triggers on product updates",
          "Add tax code management to admin interface",
          "Set up webhook to detect Stripe-side changes",
        ],
      },
    })
  } catch (error) {
    console.error("❌ Comprehensive analysis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    )
  }
}
