import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripeConfig } from "./stripe-config"

export interface ProductData {
  id: string
  name: string
  description?: string
  weight: number
  flat_price: number
  price_per_lb?: number // Optional, for display purposes only
  image_url?: string
  stripe_product_id?: string
  stripe_price_id?: string
  stripe_synced_at?: string
  stripe_active?: boolean
}

export interface SyncResult {
  success: boolean
  processed: number
  succeeded: number
  failed: number
  errors: Array<{ productId: string; error: string }>
}

// Comprehensive validation function
export const validateProductData = (product: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!product.id) {
    errors.push("Missing product ID")
  }

  if (!product.name || typeof product.name !== "string" || product.name.trim() === "") {
    errors.push("Missing or invalid product name")
  }

  if (!product.weight || typeof product.weight !== "number" || product.weight <= 0) {
    errors.push("Missing or invalid weight (must be positive number)")
  }

  if (!product.flat_price || typeof product.flat_price !== "number" || product.flat_price <= 0) {
    errors.push("Missing or invalid flat_price (must be positive number)")
  }

  if (product.image_url && typeof product.image_url !== "string") {
    errors.push("Invalid image_url (must be string)")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Check if Stripe columns exist in products table
export const checkStripeColumnsExist = async (): Promise<boolean> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from("products")
      .select("stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active")
      .limit(1)

    return !error
  } catch (error) {
    console.error("Error checking Stripe columns:", error)
    return false
  }
}

// Get all products that need syncing
export const getProductsForSync = async (): Promise<ProductData[]> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const hasStripeColumns = await checkStripeColumnsExist()

    // First, check what columns actually exist
    const { data: schemaCheck, error: schemaError } = await supabaseAdmin.from("products").select("*").limit(1)

    if (schemaError) {
      console.error("Error checking schema:", schemaError)
      return []
    }

    // Determine available columns
    const hasFlat_price = schemaCheck && schemaCheck.length > 0 && "flat_price" in schemaCheck[0]
    const hasPricePer_lb = schemaCheck && schemaCheck.length > 0 && "price_per_lb" in schemaCheck[0]

    console.log(
      `Schema check: flat_price=${hasFlat_price}, price_per_lb=${hasPricePer_lb}, stripe_columns=${hasStripeColumns}`,
    )

    // Build select query based on available columns
    let selectColumns = "id, name, weight"

    if (hasFlat_price) {
      selectColumns += ", flat_price"
    }
    if (hasPricePer_lb) {
      selectColumns += ", price_per_lb"
    }
    if (hasStripeColumns) {
      selectColumns += ", stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active"
    }

    selectColumns += ", image_url, created_at"

    let query = supabaseAdmin.from("products").select(selectColumns).not("weight", "is", null).gt("weight", 0)

    // Add price filtering based on available columns
    if (hasFlat_price) {
      query = query.not("flat_price", "is", null).gt("flat_price", 0)
    } else if (hasPricePer_lb) {
      query = query.not("price_per_lb", "is", null).gt("price_per_lb", 0)
    }

    if (hasStripeColumns) {
      // Only sync products that haven't been synced or need re-syncing
      query = query.or("stripe_product_id.is.null,stripe_synced_at.is.null")
    }

    const { data: products, error } = await query.order("weight")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    if (!products || products.length === 0) {
      console.log("No products found")
      return []
    }

    // Transform products to ensure they have flat_price
    const transformedProducts: ProductData[] = products.map((product: any) => {
      let flat_price = product.flat_price

      // Calculate flat_price if it doesn't exist but we have weight and price_per_lb
      if (!flat_price && product.weight && product.price_per_lb) {
        flat_price = Math.round(product.weight * product.price_per_lb * 100) / 100
        console.log(`Calculated flat_price for ${product.name}: ${flat_price}`)
      }

      // Use default pricing if we still don't have a price
      if (!flat_price && product.weight) {
        const defaultPricePerLb = 2.3 // Standard price per lb
        flat_price = Math.round(product.weight * defaultPricePerLb * 100) / 100
        console.log(`Using default flat_price for ${product.name}: ${flat_price}`)
      }

      return {
        id: product.id,
        name: product.name || `${product.weight}lb Bumper Plate`,
        weight: product.weight,
        flat_price: flat_price || 0,
        price_per_lb: product.price_per_lb,
        image_url: product.image_url,
        stripe_product_id: product.stripe_product_id,
        stripe_price_id: product.stripe_price_id,
        stripe_synced_at: product.stripe_synced_at,
        stripe_active: product.stripe_active,
      }
    })

    console.log(`Found ${transformedProducts.length} products for sync`)
    return transformedProducts.filter((p) => p.flat_price > 0) // Only return products with valid pricing
  } catch (error) {
    console.error("Error in getProductsForSync:", error)
    return []
  }
}

// Create or update a single Stripe product
export const createOrUpdateStripeProduct = async (
  productData: ProductData,
): Promise<{
  product: any
  price: any
}> => {
  const validation = validateProductData(productData)
  if (!validation.isValid) {
    throw new Error(`Invalid product data: ${validation.errors.join(", ")}`)
  }

  try {
    const stripe = await getStripe()
    const config = await getStripeConfig()
    const supabaseAdmin = createSupabaseAdmin()

    console.log(`Processing product: ${productData.name} (${productData.weight}lb, $${productData.flat_price})`)

    let stripeProduct
    let stripePrice

    // Check if product already exists in Stripe
    if (productData.stripe_product_id) {
      try {
        stripeProduct = await stripe.products.retrieve(productData.stripe_product_id)
        console.log(`Found existing Stripe product: ${stripeProduct.id}`)
      } catch (error) {
        console.log("Existing Stripe product not found, will create new one")
        stripeProduct = null
      }
    }

    // Prepare product data for Stripe
    const stripeProductData: any = {
      name: productData.name,
      description: productData.description || `Hi-Temp ${productData.weight}lb Bumper Plate - Factory Second`,
      metadata: {
        weight: productData.weight.toString(),
        flat_price: productData.flat_price.toString(),
        product_id: productData.id.toString(),
        mode: config.mode || "sandbox",
        source: "carolina-bumper-plates",
        sync_timestamp: new Date().toISOString(),
      },
    }

    // Add image if available and valid
    if (productData.image_url && productData.image_url.trim()) {
      try {
        // Validate URL format
        new URL(productData.image_url)
        stripeProductData.images = [productData.image_url.trim()]
        console.log(`Including product image: ${productData.image_url}`)
      } catch (urlError) {
        console.warn(`Invalid image URL for product ${productData.id}: ${productData.image_url}`)
      }
    }

    // Create or update Stripe product
    if (!stripeProduct) {
      console.log(`Creating new Stripe product: ${productData.name}`)
      stripeProduct = await stripe.products.create(stripeProductData)
    } else {
      console.log(`Updating existing Stripe product: ${productData.name}`)
      stripeProduct = await stripe.products.update(productData.stripe_product_id, stripeProductData)
    }

    // Convert flat price to cents for Stripe
    const unitAmountCents = Math.round(productData.flat_price * 100)

    console.log(`Creating Stripe price: $${productData.flat_price} (${unitAmountCents} cents)`)

    // Create new price (Stripe prices are immutable)
    stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: unitAmountCents,
      currency: "usd",
      metadata: {
        weight: productData.weight.toString(),
        flat_price: productData.flat_price.toString(),
        product_id: productData.id.toString(),
        mode: config.mode || "sandbox",
        created_at: new Date().toISOString(),
      },
    })

    // Update database with Stripe IDs
    const hasStripeColumns = await checkStripeColumnsExist()
    if (hasStripeColumns) {
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
        console.error(`Failed to update database for product ${productData.id}:`, updateError)
        throw updateError
      }

      console.log(`✅ Successfully synced product: ${productData.name}`)
    } else {
      console.warn("Stripe columns don't exist - product created in Stripe but not tracked in database")
    }

    return {
      product: stripeProduct,
      price: stripePrice,
    }
  } catch (error) {
    console.error(`❌ Failed to sync product ${productData.name}:`, error)
    throw error
  }
}

// Comprehensive sync function
export const syncAllProductsWithStripe = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  }

  try {
    console.log("🚀 Starting comprehensive Stripe product sync...")

    // Get products that need syncing
    const products = await getProductsForSync()

    if (products.length === 0) {
      console.log("✅ No products need syncing")
      result.success = true
      return result
    }

    console.log(`📦 Found ${products.length} products to sync`)
    result.processed = products.length

    // Validate all products first
    const validProducts: ProductData[] = []
    for (const product of products) {
      const validation = validateProductData(product)
      if (validation.isValid) {
        validProducts.push(product)
      } else {
        console.error(`❌ Invalid product ${product.id}: ${validation.errors.join(", ")}`)
        result.failed++
        result.errors.push({
          productId: product.id || "unknown",
          error: `Validation failed: ${validation.errors.join(", ")}`,
        })
      }
    }

    console.log(`✅ ${validProducts.length} products passed validation`)

    // Sync each valid product
    for (const product of validProducts) {
      try {
        await createOrUpdateStripeProduct(product)
        result.succeeded++
      } catch (error) {
        result.failed++
        result.errors.push({
          productId: product.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    result.success = result.failed === 0
    console.log(`🎉 Sync completed: ${result.succeeded} succeeded, ${result.failed} failed`)

    if (result.errors.length > 0) {
      console.log("❌ Errors encountered:")
      result.errors.forEach((error) => {
        console.log(`  - Product ${error.productId}: ${error.error}`)
      })
    }

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

// Get Stripe product for a specific weight (for invoice creation)
export const getStripeProductForWeight = async (weight: number): Promise<ProductData | null> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: product, error } = await supabaseAdmin.from("products").select("*").eq("weight", weight).single()

    if (error || !product) {
      console.error(`Product not found for weight: ${weight}lb`)
      return null
    }

    const validation = validateProductData(product)
    if (!validation.isValid) {
      console.error(`Invalid product data for ${weight}lb: ${validation.errors.join(", ")}`)
      return null
    }

    // Ensure product is synced with Stripe
    const hasStripeColumns = await checkStripeColumnsExist()
    if (hasStripeColumns && (!product.stripe_product_id || !product.stripe_price_id)) {
      console.log(`Auto-syncing ${weight}lb product with Stripe...`)
      try {
        const stripeData = await createOrUpdateStripeProduct(product)
        return {
          ...product,
          stripe_product_id: stripeData.product.id,
          stripe_price_id: stripeData.price.id,
        }
      } catch (error) {
        console.error(`Failed to auto-sync ${weight}lb product:`, error)
        return null
      }
    }

    return product
  } catch (error) {
    console.error(`Error getting Stripe product for ${weight}lb:`, error)
    return null
  }
}

// Health check function
export const checkSyncHealth = async (): Promise<{
  databaseReady: boolean
  stripeConfigured: boolean
  productsCount: number
  syncedCount: number
  issues: string[]
}> => {
  const issues: string[] = []

  try {
    // Check database
    const hasStripeColumns = await checkStripeColumnsExist()
    if (!hasStripeColumns) {
      issues.push("Stripe columns missing from products table - run migration script first")
    }

    // Check if flat_price column exists
    const supabaseAdmin = createSupabaseAdmin()
    const { data: schemaCheck, error: schemaError } = await supabaseAdmin.from("products").select("*").limit(1)

    const hasFlat_price = schemaCheck && schemaCheck.length > 0 && "flat_price" in schemaCheck[0]
    if (!hasFlat_price) {
      issues.push("flat_price column missing - run schema migration script")
    }

    // Check Stripe configuration
    let stripeConfigured = false
    try {
      await getStripe()
      stripeConfigured = true
    } catch (error) {
      issues.push("Stripe configuration invalid - check environment variables")
    }

    // Check products (use safe method that handles missing columns)
    const products = await getProductsForSync()
    const syncedProducts = products.filter((p) => p.stripe_product_id && p.stripe_price_id)

    return {
      databaseReady: hasStripeColumns && hasFlat_price,
      stripeConfigured,
      productsCount: products.length,
      syncedCount: syncedProducts.length,
      issues,
    }
  } catch (error) {
    issues.push(`Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    return {
      databaseReady: false,
      stripeConfigured: false,
      productsCount: 0,
      syncedCount: 0,
      issues,
    }
  }
}
