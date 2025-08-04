import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripeConfig } from "./stripe-config"

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
  updated_at?: string
}

export interface SyncResult {
  success: boolean
  processed: number
  succeeded: number
  failed: number
  updated: number
  created: number
  errors: Array<{ productId: string; error: string }>
}

// Fixed function to check if Stripe columns exist
export const checkStripeColumnsExist = async (): Promise<boolean> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Method 1: Try to query the columns directly
    try {
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active")
        .limit(1)

      if (!error) {
        console.log("✅ All Stripe columns exist and are accessible")
        return true
      }
    } catch (queryError) {
      console.log("❌ Direct query failed, checking information_schema...")
    }

    // Method 2: Check information_schema
    const { data: columns, error: schemaError } = await supabaseAdmin
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "products")
      .in("column_name", ["stripe_product_id", "stripe_price_id", "stripe_synced_at", "stripe_active"])

    if (schemaError) {
      console.error("Error checking schema:", schemaError)
      return false
    }

    const hasAllColumns = columns && columns.length >= 4
    console.log(`📊 Found ${columns?.length || 0} Stripe columns in products table`)

    return hasAllColumns
  } catch (error) {
    console.error("Error checking Stripe columns:", error)
    return false
  }
}

// Get default tax code - hardcoded to txcd_99999999
export const getDefaultTaxCode = async (): Promise<string> => {
  return "txcd_99999999"
}

// Enhanced validation function
export const validateProductData = (product: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!product.id) {
    errors.push("Missing product ID")
  }

  if (!product.title || typeof product.title !== "string" || product.title.trim() === "") {
    errors.push("Missing or invalid product title")
  }

  if (!product.weight || typeof product.weight !== "number" || product.weight <= 0) {
    errors.push("Missing or invalid weight (must be positive number)")
  }

  if (!product.selling_price || typeof product.selling_price !== "number" || product.selling_price <= 0) {
    errors.push("Missing or invalid selling_price (must be positive number)")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Enhanced sync function with tax code support
export const createOrUpdateStripeProduct = async (
  productData: ProductData,
  forceUpdate = false,
): Promise<{
  product: any
  price: any
  action: "created" | "updated" | "no_change"
}> => {
  const validation = validateProductData(productData)
  if (!validation.isValid) {
    throw new Error(`Invalid product data: ${validation.errors.join(", ")}`)
  }

  try {
    const stripe = await getStripe()
    const config = await getStripeConfig()
    const supabaseAdmin = createSupabaseAdmin()
    const taxCode = await getDefaultTaxCode()

    console.log(`🔄 Processing product: ${productData.title} (${productData.weight}lb, $${productData.selling_price})`)
    console.log(`📋 Using tax code: ${taxCode}`)

    let stripeProduct
    let action: "created" | "updated" = "created"

    // Prepare product data for Stripe with tax code
    const stripeProductData: any = {
      name: productData.title,
      description: productData.description || `Hi-Temp ${productData.weight}lb Bumper Plate - Factory Second`,
      tax_code: taxCode,
      metadata: {
        weight: productData.weight.toString(),
        selling_price: productData.selling_price.toString(),
        regular_price: productData.regular_price.toString(),
        product_id: productData.id.toString(),
        mode: config.mode || "sandbox",
        source: "carolina-bumper-plates",
        sync_timestamp: new Date().toISOString(),
        tax_code: taxCode,
      },
    }

    // Add image if available and valid
    if (productData.image_url && productData.image_url.trim()) {
      try {
        new URL(productData.image_url)
        stripeProductData.images = [productData.image_url.trim()]
        console.log(`🖼️ Including product image: ${productData.image_url}`)
      } catch (urlError) {
        console.warn(`⚠️ Invalid image URL for product ${productData.id}: ${productData.image_url}`)
      }
    }

    // Create or update Stripe product
    if (!productData.stripe_product_id) {
      console.log(`➕ Creating new Stripe product: ${productData.title} with tax code: ${taxCode}`)
      stripeProduct = await stripe.products.create(stripeProductData)
      action = "created"
    } else {
      console.log(`🔄 Updating existing Stripe product: ${productData.title} with tax code: ${taxCode}`)
      stripeProduct = await stripe.products.update(productData.stripe_product_id, stripeProductData)
      action = "updated"
    }

    // Handle pricing
    const unitAmountCents = Math.round(productData.selling_price * 100)
    console.log(`💰 Creating Stripe price: $${productData.selling_price} (${unitAmountCents} cents)`)

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: unitAmountCents,
      currency: "usd",
      tax_behavior: "exclusive",
      metadata: {
        weight: productData.weight.toString(),
        selling_price: productData.selling_price.toString(),
        regular_price: productData.regular_price.toString(),
        product_id: productData.id.toString(),
        mode: config.mode || "sandbox",
        created_at: new Date().toISOString(),
        tax_code: taxCode,
      },
    })

    // Update database with Stripe IDs and sync timestamp
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id,
        stripe_synced_at: new Date().toISOString(),
        stripe_active: true,
      })
      .eq("id", productData.id)

    if (updateError) {
      console.error(`❌ Failed to update database for product ${productData.id}:`, updateError)
      throw updateError
    }

    console.log(`✅ Successfully ${action} product: ${productData.title} with tax code: ${taxCode}`)

    return {
      product: stripeProduct,
      price: stripePrice,
      action,
    }
  } catch (error) {
    console.error(`❌ Failed to sync product ${productData.title}:`, error)
    throw error
  }
}

// Get ALL products for display - with fallback for missing columns
export const getAllProductsWithSyncStatus = async (): Promise<ProductData[]> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const hasStripeColumns = await checkStripeColumnsExist()

    let selectColumns = "id, title, weight, selling_price, regular_price, available, image_url"

    if (hasStripeColumns) {
      selectColumns += ", stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active"
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

    // Add default Stripe column values if they don't exist
    const productsWithDefaults = (products || []).map((product) => ({
      ...product,
      stripe_product_id: product.stripe_product_id || null,
      stripe_price_id: product.stripe_price_id || null,
      stripe_synced_at: product.stripe_synced_at || null,
      stripe_active: product.stripe_active || false,
    }))

    return productsWithDefaults
  } catch (error) {
    console.error("Error in getAllProductsWithSyncStatus:", error)
    return []
  }
}

// Enhanced sync function
export const syncAllProductsWithStripe = async (forceUpdate = false): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    processed: 0,
    succeeded: 0,
    failed: 0,
    updated: 0,
    created: 0,
    errors: [],
  }

  try {
    console.log("🚀 Starting enhanced Stripe product sync with tax codes...")

    // Check if Stripe columns exist
    const hasStripeColumns = await checkStripeColumnsExist()
    if (!hasStripeColumns) {
      throw new Error("Stripe columns missing from products table - run migration script first")
    }

    const taxCode = await getDefaultTaxCode()
    console.log(`📋 All products will use tax code: ${taxCode}`)

    // Get products for sync
    const products = await getAllProductsWithSyncStatus()

    if (products.length === 0) {
      console.log("✅ No products found for syncing")
      result.success = true
      return result
    }

    console.log(`📦 Found ${products.length} products to sync`)
    result.processed = products.length

    // Process each product
    for (const product of products) {
      try {
        const validation = validateProductData(product)
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
        }

        const syncResult = await createOrUpdateStripeProduct(product, forceUpdate)

        result.succeeded++

        if (syncResult.action === "created") {
          result.created++
        } else if (syncResult.action === "updated") {
          result.updated++
        }
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
    console.log(
      `🎉 Sync completed: ${result.succeeded} succeeded (${result.created} created, ${result.updated} updated), ${result.failed} failed`,
    )
    console.log(`📋 All synced products now use tax code: ${taxCode}`)

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

    // Check if Stripe columns exist
    const hasStripeColumns = await checkStripeColumnsExist()

    // Check products count
    const { count: productsCount } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("available", true)
      .gt("weight", 0)
      .gt("selling_price", 0)

    // Check synced count (only if columns exist)
    let syncedCount = 0
    if (hasStripeColumns) {
      const { count } = await supabaseAdmin
        .from("products")
        .select("*", { count: "exact", head: true })
        .not("stripe_product_id", "is", null)
        .not("stripe_price_id", "is", null)
      syncedCount = count || 0
    }

    // Get tax code
    const taxCode = await getDefaultTaxCode()

    const issues = []
    if (!hasStripeColumns) {
      issues.push("Stripe columns missing from products table - run migration script first")
    }

    // Check Stripe configuration
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
