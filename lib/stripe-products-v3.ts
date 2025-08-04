import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripeConfig } from "./stripe-config"

export interface ProductData {
  id: string
  title: string
  description?: string
  weight: number
  selling_price: number // This is the flat price customers pay
  regular_price: number // For display/comparison purposes
  available: boolean
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

  if (!product.title || typeof product.title !== "string" || product.title.trim() === "") {
    errors.push("Missing or invalid product title")
  }

  if (!product.weight || typeof product.weight !== "number" || product.weight <= 0) {
    errors.push("Missing or invalid weight (must be positive number)")
  }

  if (!product.selling_price || typeof product.selling_price !== "number" || product.selling_price <= 0) {
    errors.push("Missing or invalid selling_price (must be positive number)")
  }

  if (product.image_url && typeof product.image_url !== "string") {
    errors.push("Invalid image_url (must be string)")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Check if Stripe columns exist in products table - IMPROVED VERSION
export const checkStripeColumnsExist = async (): Promise<{
  exists: boolean
  missingColumns: string[]
  allColumns: string[]
}> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Get all column names from products table
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc("get_table_columns", { table_name: "products" })
      .single()

    if (columnsError) {
      console.log("RPC not available, trying direct query...")

      // Fallback: try a simple select to see what columns exist
      const { data: sampleData, error: sampleError } = await supabaseAdmin.from("products").select("*").limit(1)

      if (sampleError) {
        console.error("Error checking columns:", sampleError)
        return {
          exists: false,
          missingColumns: ["stripe_product_id", "stripe_price_id", "stripe_synced_at", "stripe_active"],
          allColumns: [],
        }
      }

      // Check what columns exist based on the sample data
      const existingColumns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : []
      const requiredColumns = ["stripe_product_id", "stripe_price_id", "stripe_synced_at", "stripe_active"]
      const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col))

      console.log("Existing columns:", existingColumns)
      console.log("Missing columns:", missingColumns)

      return {
        exists: missingColumns.length === 0,
        missingColumns,
        allColumns: existingColumns,
      }
    }

    return {
      exists: true,
      missingColumns: [],
      allColumns: columns || [],
    }
  } catch (error) {
    console.error("Error checking Stripe columns:", error)

    // Final fallback - try individual column checks
    try {
      const supabaseAdmin = createSupabaseAdmin()
      const requiredColumns = ["stripe_product_id", "stripe_price_id", "stripe_synced_at", "stripe_active"]
      const missingColumns: string[] = []

      for (const column of requiredColumns) {
        try {
          const { error } = await supabaseAdmin.from("products").select(column).limit(1)

          if (error && error.message.includes("column")) {
            missingColumns.push(column)
          }
        } catch (colError) {
          missingColumns.push(column)
        }
      }

      return {
        exists: missingColumns.length === 0,
        missingColumns,
        allColumns: [],
      }
    } catch (fallbackError) {
      console.error("All column checks failed:", fallbackError)
      return {
        exists: false,
        missingColumns: ["stripe_product_id", "stripe_price_id", "stripe_synced_at", "stripe_active"],
        allColumns: [],
      }
    }
  }
}

// Get ALL products for display (not just ones that need syncing)
export const getAllProductsWithSyncStatus = async (): Promise<ProductData[]> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const columnCheck = await checkStripeColumnsExist()

    console.log(`Fetching ALL products for display. Stripe columns exist: ${columnCheck.exists}`)

    // Build select query based on available columns
    let selectColumns = "id, title, weight, selling_price, regular_price, available, description, image_url, created_at"

    if (columnCheck.exists) {
      selectColumns += ", stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active"
    }

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(selectColumns)
      .not("weight", "is", null)
      .not("selling_price", "is", null)
      .gt("weight", 0)
      .gt("selling_price", 0)
      .eq("available", true) // Only show available products
      .order("weight")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    if (!products || products.length === 0) {
      console.log("No products found")
      return []
    }

    console.log(`Found ${products.length} total products`)
    return products
  } catch (error) {
    console.error("Error in getAllProductsWithSyncStatus:", error)
    return []
  }
}

// Get products that need syncing (for sync operations only)
export const getProductsForSync = async (): Promise<ProductData[]> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const columnCheck = await checkStripeColumnsExist()

    console.log(`Fetching products for sync. Stripe columns exist: ${columnCheck.exists}`)

    // Build select query based on available columns
    let selectColumns = "id, title, weight, selling_price, regular_price, available, description, image_url, created_at"

    if (columnCheck.exists) {
      selectColumns += ", stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active"
    }

    let query = supabaseAdmin
      .from("products")
      .select(selectColumns)
      .not("weight", "is", null)
      .not("selling_price", "is", null)
      .gt("weight", 0)
      .gt("selling_price", 0)
      .eq("available", true) // Only sync available products

    if (columnCheck.exists) {
      // Only sync products that haven't been synced or need re-syncing
      query = query.or("stripe_product_id.is.null,stripe_synced_at.is.null")
    }

    const { data: products, error } = await query.order("weight")

    if (error) {
      console.error("Error fetching products for sync:", error)
      return []
    }

    if (!products || products.length === 0) {
      console.log("No products found for sync")
      return []
    }

    console.log(`Found ${products.length} products for sync`)
    return products
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

    console.log(`Processing product: ${productData.title} (${productData.weight}lb, $${productData.selling_price})`)

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
      name: productData.title,
      description: productData.description || `Hi-Temp ${productData.weight}lb Bumper Plate - Factory Second`,
      metadata: {
        weight: productData.weight.toString(),
        selling_price: productData.selling_price.toString(),
        regular_price: productData.regular_price.toString(),
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
      console.log(`Creating new Stripe product: ${productData.title}`)
      stripeProduct = await stripe.products.create(stripeProductData)
    } else {
      console.log(`Updating existing Stripe product: ${productData.title}`)
      stripeProduct = await stripe.products.update(productData.stripe_product_id, stripeProductData)
    }

    // Convert selling price to cents for Stripe
    const unitAmountCents = Math.round(productData.selling_price * 100)

    console.log(`Creating Stripe price: $${productData.selling_price} (${unitAmountCents} cents)`)

    // Create new price (Stripe prices are immutable)
    stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: unitAmountCents,
      currency: "usd",
      metadata: {
        weight: productData.weight.toString(),
        selling_price: productData.selling_price.toString(),
        regular_price: productData.regular_price.toString(),
        product_id: productData.id.toString(),
        mode: config.mode || "sandbox",
        created_at: new Date().toISOString(),
      },
    })

    // Update database with Stripe IDs
    const columnCheck = await checkStripeColumnsExist()
    if (columnCheck.exists) {
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

      console.log(`✅ Successfully synced product: ${productData.title}`)
    } else {
      console.warn("Stripe columns don't exist - product created in Stripe but not tracked in database")
    }

    return {
      product: stripeProduct,
      price: stripePrice,
    }
  } catch (error) {
    console.error(`❌ Failed to sync product ${productData.title}:`, error)
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

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("weight", weight)
      .eq("available", true)
      .single()

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
    const columnCheck = await checkStripeColumnsExist()
    if (columnCheck.exists && (!product.stripe_product_id || !product.stripe_price_id)) {
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

// Health check function - IMPROVED
export const checkSyncHealth = async (): Promise<{
  databaseReady: boolean
  stripeConfigured: boolean
  productsCount: number
  syncedCount: number
  issues: string[]
  columnInfo: {
    exists: boolean
    missingColumns: string[]
    allColumns: string[]
  }
}> => {
  const issues: string[] = []

  try {
    // Check database columns
    const columnCheck = await checkStripeColumnsExist()

    if (!columnCheck.exists) {
      issues.push(`Stripe columns missing from products table: ${columnCheck.missingColumns.join(", ")}`)
    }

    // Check Stripe configuration
    let stripeConfigured = false
    try {
      await getStripe()
      stripeConfigured = true
    } catch (error) {
      issues.push("Stripe configuration invalid - check environment variables")
    }

    // Check ALL products (not just ones needing sync)
    const allProducts = await getAllProductsWithSyncStatus()
    const syncedProducts = allProducts.filter((p) => p.stripe_product_id && p.stripe_price_id)

    return {
      databaseReady: columnCheck.exists,
      stripeConfigured,
      productsCount: allProducts.length,
      syncedCount: syncedProducts.length,
      issues,
      columnInfo: columnCheck,
    }
  } catch (error) {
    issues.push(`Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    return {
      databaseReady: false,
      stripeConfigured: false,
      productsCount: 0,
      syncedCount: 0,
      issues,
      columnInfo: {
        exists: false,
        missingColumns: ["stripe_product_id", "stripe_price_id", "stripe_synced_at", "stripe_active"],
        allColumns: [],
      },
    }
  }
}
