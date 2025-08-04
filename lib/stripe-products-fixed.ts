import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "@/lib/supabase"

export interface ProductData {
  id: string
  title: string
  description?: string
  weight: number
  selling_price: number
  regular_price: number
  available: boolean
  image_url?: string
  stripe_product_id?: string
  stripe_price_id?: string
  stripe_synced_at?: string
  stripe_active?: boolean
  stripe_price_amount?: number
  updated_at?: string
}

export interface SyncResult {
  success: boolean
  processed: number
  succeeded: number
  failed: number
  updated: number
  created: number
  skipped: number
  reused: number
  errors: Array<{ productId: string; error: string }>
}

// Get default tax code
export const getDefaultTaxCode = async (): Promise<string> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: settings, error } = await supabaseAdmin
      .from("stripe_settings")
      .select("default_tax_code")
      .eq("id", 1)
      .single()

    if (error || !settings?.default_tax_code) {
      console.log("⚠️ No tax code in settings, using default: txcd_99999999")
      return "txcd_99999999"
    }

    console.log(`📋 Using tax code from settings: ${settings.default_tax_code}`)
    return settings.default_tax_code
  } catch (error) {
    console.error("Error fetching tax code:", error)
    console.log("⚠️ Fallback to default tax code: txcd_99999999")
    return "txcd_99999999"
  }
}

// Check if Stripe columns exist
export const checkStripeColumnsExist = async (): Promise<boolean> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active")
      .limit(1)

    if (!error) {
      console.log("✅ All Stripe columns exist and are accessible")
      return true
    }

    console.log("❌ Stripe columns missing from products table")
    return false
  } catch (error) {
    console.error("Error checking Stripe columns:", error)
    return false
  }
}

// Enhanced function to find existing price with same amount
const findExistingPrice = async (stripeProductId: string, unitAmount: number): Promise<any | null> => {
  try {
    const stripe = await getStripe()

    console.log(`🔍 Checking for existing price: Product ${stripeProductId}, Amount ${unitAmount} cents`)

    const prices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      limit: 100,
    })

    const matchingPrice = prices.data.find((price) => price.unit_amount === unitAmount && price.currency === "usd")

    if (matchingPrice) {
      console.log(`✅ Found existing price ${matchingPrice.id} with amount ${unitAmount} cents`)
      return matchingPrice
    }

    console.log(`❌ No existing price found with amount ${unitAmount} cents`)
    return null
  } catch (error) {
    console.error("Error finding existing price:", error)
    return null
  }
}

// Archive old prices that don't match current amount
const archiveOldPrices = async (stripeProductId: string, currentUnitAmount: number): Promise<number> => {
  try {
    const stripe = await getStripe()

    const prices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      limit: 100,
    })

    let archivedCount = 0

    for (const price of prices.data) {
      // Archive prices that don't match the current amount
      if (price.unit_amount !== currentUnitAmount) {
        try {
          await stripe.prices.update(price.id, { active: false })
          archivedCount++
          console.log(`📦 Archived old price ${price.id} (${price.unit_amount} cents)`)
        } catch (archiveError) {
          console.error(`Failed to archive price ${price.id}:`, archiveError)
        }
      }
    }

    if (archivedCount > 0) {
      console.log(`✅ Archived ${archivedCount} old prices for product ${stripeProductId}`)
    }

    return archivedCount
  } catch (error) {
    console.error("Error archiving old prices:", error)
    return 0
  }
}

// Smart price management - ONLY create if needed
const createOrReusePrice = async (
  stripeProductId: string,
  unitAmount: number,
  taxCode: string,
): Promise<{ price: any; action: "reused" | "created" }> => {
  try {
    // First, check if we already have a price with this exact amount
    const existingPrice = await findExistingPrice(stripeProductId, unitAmount)

    if (existingPrice) {
      console.log(`♻️ Reusing existing price ${existingPrice.id} for ${unitAmount} cents`)
      return { price: existingPrice, action: "reused" }
    }

    // Archive any old prices with different amounts
    await archiveOldPrices(stripeProductId, unitAmount)

    // Only create new price if we don't have one with this amount
    console.log(`➕ Creating new price for ${unitAmount} cents`)
    const stripe = await getStripe()

    const newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: unitAmount,
      currency: "usd",
      tax_behavior: "exclusive",
      metadata: {
        tax_code: taxCode,
        created_by: "carolina-bumper-plates-sync",
        created_at: new Date().toISOString(),
      },
    })

    console.log(`✅ Created new price ${newPrice.id} for ${unitAmount} cents`)
    return { price: newPrice, action: "created" }
  } catch (error) {
    console.error("Error in createOrReusePrice:", error)
    throw error
  }
}

// Enhanced sync function that prevents duplicate prices
export const createOrUpdateStripeProduct = async (
  productData: ProductData,
  forceUpdate = false,
): Promise<{
  product: any
  price: any
  action: "created" | "updated" | "no_change"
  priceAction: "reused" | "created" | "no_change"
}> => {
  try {
    const stripe = await getStripe()
    const supabaseAdmin = createSupabaseAdmin()
    const taxCode = await getDefaultTaxCode()

    console.log(`🔄 Processing product: ${productData.title} (${productData.weight}lb, $${productData.selling_price})`)

    const unitAmountCents = Math.round(productData.selling_price * 100)
    console.log(`💰 Target price: ${unitAmountCents} cents`)

    let stripeProduct
    let productAction: "created" | "updated" | "no_change" = "no_change"

    // Handle Stripe product creation/update
    const stripeProductData: any = {
      name: productData.title,
      description: productData.description || `Hi-Temp ${productData.weight}lb Bumper Plate - Factory Second`,
      tax_code: taxCode,
      metadata: {
        weight: productData.weight.toString(),
        selling_price: productData.selling_price.toString(),
        regular_price: productData.regular_price.toString(),
        product_id: productData.id.toString(),
        source: "carolina-bumper-plates",
        sync_timestamp: new Date().toISOString(),
        tax_code: taxCode,
      },
    }

    if (productData.image_url && productData.image_url.trim()) {
      try {
        new URL(productData.image_url)
        stripeProductData.images = [productData.image_url.trim()]
      } catch (urlError) {
        console.warn(`⚠️ Invalid image URL for product ${productData.id}`)
      }
    }

    if (!productData.stripe_product_id) {
      console.log(`➕ Creating new Stripe product: ${productData.title}`)
      stripeProduct = await stripe.products.create(stripeProductData)
      productAction = "created"
    } else {
      console.log(`🔄 Updating existing Stripe product: ${productData.title}`)
      stripeProduct = await stripe.products.update(productData.stripe_product_id, stripeProductData)
      productAction = "updated"
    }

    // Smart price handling - check if we need to create/update price
    let priceResult
    let priceAction: "reused" | "created" | "no_change" = "no_change"

    // Check if we already have the correct price in our database
    if (productData.stripe_price_id && productData.stripe_price_amount === unitAmountCents && !forceUpdate) {
      console.log(
        `✅ Price unchanged (${unitAmountCents} cents), keeping existing price ${productData.stripe_price_id}`,
      )

      // Verify the price still exists and is active in Stripe
      try {
        const existingPrice = await stripe.prices.retrieve(productData.stripe_price_id)
        if (existingPrice.active && existingPrice.unit_amount === unitAmountCents) {
          priceResult = { price: existingPrice, action: "reused" as const }
          priceAction = "no_change"
        } else {
          // Price exists but is inactive or wrong amount, need to create new one
          priceResult = await createOrReusePrice(stripeProduct.id, unitAmountCents, taxCode)
          priceAction = priceResult.action
        }
      } catch (priceError) {
        // Price doesn't exist in Stripe, create new one
        console.log(`⚠️ Stored price ${productData.stripe_price_id} not found in Stripe, creating new one`)
        priceResult = await createOrReusePrice(stripeProduct.id, unitAmountCents, taxCode)
        priceAction = priceResult.action
      }
    } else {
      // Price changed or no existing price, handle accordingly
      if (productData.stripe_price_amount !== unitAmountCents) {
        console.log(`💰 Price changed from ${productData.stripe_price_amount || "none"} to ${unitAmountCents} cents`)
      }
      priceResult = await createOrReusePrice(stripeProduct.id, unitAmountCents, taxCode)
      priceAction = priceResult.action
    }

    // Update database with current Stripe data
    const updateData: any = {
      stripe_product_id: stripeProduct.id,
      stripe_price_id: priceResult.price.id,
      stripe_price_amount: unitAmountCents,
      stripe_synced_at: new Date().toISOString(),
      stripe_active: true,
    }

    const { error: updateError } = await supabaseAdmin.from("products").update(updateData).eq("id", productData.id)

    if (updateError) {
      console.error(`❌ Failed to update database for product ${productData.id}:`, updateError)
      throw updateError
    }

    console.log(`✅ Product sync complete: ${productData.title} (Product: ${productAction}, Price: ${priceAction})`)

    return {
      product: stripeProduct,
      price: priceResult.price,
      action: productAction,
      priceAction: priceAction,
    }
  } catch (error) {
    console.error(`❌ Failed to sync product ${productData.title}:`, error)
    throw error
  }
}

// Get ALL products for display
export const getAllProductsWithSyncStatus = async (): Promise<ProductData[]> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const hasStripeColumns = await checkStripeColumnsExist()

    let selectColumns = "id, title, weight, selling_price, regular_price, available, image_url"

    if (hasStripeColumns) {
      selectColumns += ", stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active, stripe_price_amount"
    }

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(selectColumns)
      .not("weight", "is", null)
      .not("selling_price", "is", null)
      .gt("weight", 0)
      .gt("selling_price", 0)
      .eq("available", true)
      .order("weight")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    const productsWithDefaults = (products || []).map((product) => ({
      ...product,
      stripe_product_id: product.stripe_product_id || null,
      stripe_price_id: product.stripe_price_id || null,
      stripe_synced_at: product.stripe_synced_at || null,
      stripe_active: product.stripe_active || false,
      stripe_price_amount: product.stripe_price_amount || null,
    }))

    return productsWithDefaults
  } catch (error) {
    console.error("Error in getAllProductsWithSyncStatus:", error)
    return []
  }
}

// Enhanced sync function with duplicate prevention
export const syncAllProductsWithStripe = async (forceUpdate = false): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    processed: 0,
    succeeded: 0,
    failed: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    reused: 0,
    errors: [],
  }

  try {
    console.log("🚀 Starting enhanced Stripe product sync (duplicate prevention enabled)...")

    const hasStripeColumns = await checkStripeColumnsExist()
    if (!hasStripeColumns) {
      throw new Error("Stripe columns missing from products table - run migration script first")
    }

    const taxCode = await getDefaultTaxCode()
    console.log(`📋 All products will use tax code: ${taxCode}`)

    const products = await getAllProductsWithSyncStatus()

    if (products.length === 0) {
      console.log("✅ No products found for syncing")
      result.success = true
      return result
    }

    console.log(`📦 Found ${products.length} products to process`)
    result.processed = products.length

    for (const product of products) {
      try {
        const syncResult = await createOrUpdateStripeProduct(product, forceUpdate)

        result.succeeded++

        // Track different types of actions
        if (syncResult.action === "created") {
          result.created++
        } else if (syncResult.action === "updated") {
          result.updated++
        }

        if (syncResult.priceAction === "reused") {
          result.reused++
        } else if (syncResult.priceAction === "no_change") {
          result.skipped++
        }

        console.log(`✅ ${product.title}: Product ${syncResult.action}, Price ${syncResult.priceAction}`)
      } catch (error) {
        result.failed++
        result.errors.push({
          productId: product.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        console.error(`❌ Failed to sync product ${product.title}:`, error)
      }
    }

    result.success = result.failed === 0

    console.log(`🎉 Sync completed:`)
    console.log(`  - ${result.succeeded} succeeded, ${result.failed} failed`)
    console.log(`  - Products: ${result.created} created, ${result.updated} updated`)
    console.log(`  - Prices: ${result.reused} reused, ${result.skipped} unchanged`)
    console.log(`📋 All synced products use tax code: ${taxCode}`)

    return result
  } catch (error) {
    console.error("💥 Critical error in sync process:", error)
    result.errors.push({
      productId: "system",
      error: error instanceof Error ? error.message : "Critical sync failure",
    })
    return result
  }
}

// Health check function
export const checkSyncHealth = async () => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const hasStripeColumns = await checkStripeColumnsExist()

    const { count: productsCount } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("available", true)
      .gt("weight", 0)
      .gt("selling_price", 0)

    let syncedCount = 0
    if (hasStripeColumns) {
      const { count } = await supabaseAdmin
        .from("products")
        .select("*", { count: "exact", head: true })
        .not("stripe_product_id", "is", null)
        .not("stripe_price_id", "is", null)
      syncedCount = count || 0
    }

    const taxCode = await getDefaultTaxCode()

    const issues = []
    if (!hasStripeColumns) {
      issues.push("Stripe columns missing from products table - run migration script first")
    }

    let stripeConfigured = false
    try {
      const stripe = await getStripe()
      stripeConfigured = !!stripe
    } catch (error) {
      issues.push("Stripe not configured properly")
    }

    return {
      databaseReady: hasStripeColumns,
      stripeConfigured,
      productsCount: productsCount || 0,
      syncedCount,
      taxCode,
      issues,
      columnInfo: {
        hasStripeColumns,
        message: hasStripeColumns ? "All Stripe columns present" : "Stripe columns missing",
      },
    }
  } catch (error) {
    console.error("Error in checkSyncHealth:", error)
    return {
      databaseReady: false,
      stripeConfigured: false,
      productsCount: 0,
      syncedCount: 0,
      taxCode: "txcd_99999999",
      issues: ["Health check failed"],
      columnInfo: { hasStripeColumns: false, message: "Health check failed" },
    }
  }
}
