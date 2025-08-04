import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "@/lib/supabase"

export interface DuplicatePriceAnalysis {
  productId: string
  productName: string
  stripeProductId: string
  activePrices: Array<{
    id: string
    unit_amount: number
    created: number
    active: boolean
  }>
  hasDuplicates: boolean
  recommendedAction: string
}

// Simple function to get products with Stripe data
export const getProductsWithStripeData = async () => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, title, weight, selling_price, stripe_product_id, stripe_price_id")
      .not("stripe_product_id", "is", null)
      .eq("available", true)
      .order("weight")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    return products || []
  } catch (error) {
    console.error("Error in getProductsWithStripeData:", error)
    return []
  }
}

// Simple function to analyze duplicate prices
export const analyzeDuplicatePrices = async (): Promise<DuplicatePriceAnalysis[]> => {
  try {
    const stripe = await getStripe()
    const products = await getProductsWithStripeData()

    console.log(`Analyzing ${products.length} products for duplicate prices...`)

    const analysis: DuplicatePriceAnalysis[] = []

    for (const product of products) {
      if (!product.stripe_product_id) continue

      try {
        // Get all prices for this product
        const prices = await stripe.prices.list({
          product: product.stripe_product_id,
          limit: 100,
        })

        const activePrices = prices.data.filter((price) => price.active)

        analysis.push({
          productId: product.id,
          productName: product.title,
          stripeProductId: product.stripe_product_id,
          activePrices: activePrices.map((price) => ({
            id: price.id,
            unit_amount: price.unit_amount || 0,
            created: price.created,
            active: price.active,
          })),
          hasDuplicates: activePrices.length > 1,
          recommendedAction:
            activePrices.length > 1 ? `Archive ${activePrices.length - 1} duplicate prices` : "No action needed",
        })

        if (activePrices.length > 1) {
          console.log(`⚠️ Found ${activePrices.length} active prices for ${product.title}`)
        }
      } catch (priceError) {
        console.error(`Error analyzing prices for ${product.title}:`, priceError)
        analysis.push({
          productId: product.id,
          productName: product.title,
          stripeProductId: product.stripe_product_id,
          activePrices: [],
          hasDuplicates: false,
          recommendedAction: "Error - could not analyze",
        })
      }
    }

    const duplicateCount = analysis.filter((a) => a.hasDuplicates).length
    console.log(`Analysis complete: ${duplicateCount} products have duplicate prices`)

    return analysis
  } catch (error) {
    console.error("Error in analyzeDuplicatePrices:", error)
    return []
  }
}

// Simple function to fix duplicate prices for a single product
export const fixDuplicatePricesForProduct = async (
  productId: string,
): Promise<{
  success: boolean
  message: string
  archivedPrices: number
}> => {
  try {
    const stripe = await getStripe()
    const supabaseAdmin = createSupabaseAdmin()

    // Get product data
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, title, stripe_product_id, selling_price")
      .eq("id", productId)
      .single()

    if (productError || !product?.stripe_product_id) {
      return {
        success: false,
        message: "Product not found or missing Stripe product ID",
        archivedPrices: 0,
      }
    }

    // Get all active prices
    const prices = await stripe.prices.list({
      product: product.stripe_product_id,
      active: true,
      limit: 100,
    })

    const activePrices = prices.data

    if (activePrices.length <= 1) {
      return {
        success: true,
        message: "No duplicate prices found",
        archivedPrices: 0,
      }
    }

    // Sort prices by creation date (newest first)
    activePrices.sort((a, b) => b.created - a.created)

    // Keep the newest price, archive the rest
    const pricesToArchive = activePrices.slice(1)
    let archivedCount = 0

    for (const price of pricesToArchive) {
      try {
        await stripe.prices.update(price.id, { active: false })
        archivedCount++
        console.log(`Archived duplicate price ${price.id} for ${product.title}`)
      } catch (archiveError) {
        console.error(`Failed to archive price ${price.id}:`, archiveError)
      }
    }

    // Update database with the current active price
    const currentPrice = activePrices[0]
    await supabaseAdmin
      .from("products")
      .update({
        stripe_price_id: currentPrice.id,
        stripe_price_amount: currentPrice.unit_amount,
        stripe_price_updated_at: new Date().toISOString(),
      })
      .eq("id", productId)

    return {
      success: true,
      message: `Successfully archived ${archivedCount} duplicate prices`,
      archivedPrices: archivedCount,
    }
  } catch (error) {
    console.error(`Error fixing duplicates for product ${productId}:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      archivedPrices: 0,
    }
  }
}

// Simple function to fix all duplicate prices
export const fixAllDuplicatePrices = async (): Promise<{
  success: boolean
  totalProcessed: number
  totalFixed: number
  totalArchivedPrices: number
  errors: string[]
}> => {
  try {
    console.log("Starting bulk duplicate price cleanup...")

    const analysis = await analyzeDuplicatePrices()
    const productsWithDuplicates = analysis.filter((a) => a.hasDuplicates)

    console.log(`Found ${productsWithDuplicates.length} products with duplicate prices`)

    let totalFixed = 0
    let totalArchivedPrices = 0
    const errors: string[] = []

    for (const product of productsWithDuplicates) {
      try {
        const result = await fixDuplicatePricesForProduct(product.productId)

        if (result.success) {
          totalFixed++
          totalArchivedPrices += result.archivedPrices
          console.log(`✅ Fixed duplicates for ${product.productName}`)
        } else {
          errors.push(`${product.productName}: ${result.message}`)
          console.error(`❌ Failed to fix ${product.productName}: ${result.message}`)
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push(`${product.productName}: ${errorMessage}`)
        console.error(`❌ Error processing ${product.productName}:`, error)
      }
    }

    console.log(`Cleanup complete: ${totalFixed} products fixed, ${totalArchivedPrices} prices archived`)

    return {
      success: errors.length === 0,
      totalProcessed: productsWithDuplicates.length,
      totalFixed,
      totalArchivedPrices,
      errors,
    }
  } catch (error) {
    console.error("Error in fixAllDuplicatePrices:", error)
    return {
      success: false,
      totalProcessed: 0,
      totalFixed: 0,
      totalArchivedPrices: 0,
      errors: [error instanceof Error ? error.message : "Critical error in bulk cleanup"],
    }
  }
}
