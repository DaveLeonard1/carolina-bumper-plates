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

// Check if product needs updating in Stripe
export const needsStripeUpdate = async (
  product: ProductData,
): Promise<{
  needsUpdate: boolean
  reasons: string[]
  currentStripeData?: any
}> => {
  const reasons: string[] = []

  if (!product.stripe_product_id) {
    return {
      needsUpdate: true,
      reasons: ["Product not yet synced with Stripe"],
    }
  }

  try {
    const stripe = await getStripe()
    const stripeProduct = await stripe.products.retrieve(product.stripe_product_id)

    // Check if name changed
    if (stripeProduct.name !== product.title) {
      reasons.push(`Name changed: "${stripeProduct.name}" → "${product.title}"`)
    }

    // Check if description changed
    const expectedDescription = product.description || `Hi-Temp ${product.weight}lb Bumper Plate - Factory Second`
    if (stripeProduct.description !== expectedDescription) {
      reasons.push(`Description changed`)
    }

    // Check if metadata is outdated
    const metadata = stripeProduct.metadata || {}
    if (metadata.weight !== product.weight.toString()) {
      reasons.push(`Weight metadata outdated: ${metadata.weight} → ${product.weight}`)
    }

    if (metadata.selling_price !== product.selling_price.toString()) {
      reasons.push(`Price metadata outdated: ${metadata.selling_price} → ${product.selling_price}`)
    }

    // Check if image changed
    if (product.image_url && (!stripeProduct.images || !stripeProduct.images.includes(product.image_url))) {
      reasons.push(`Image updated`)
    }

    return {
      needsUpdate: reasons.length > 0,
      reasons,
      currentStripeData: stripeProduct,
    }
  } catch (error) {
    console.error(`Error checking Stripe product ${product.stripe_product_id}:`, error)
    return {
      needsUpdate: true,
      reasons: [`Stripe product not accessible: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}

// Enhanced sync function that handles updates properly
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

    console.log(`🔄 Processing product: ${productData.title} (${productData.weight}lb, $${productData.selling_price})`)

    // Check if update is needed
    const updateCheck = await needsStripeUpdate(productData)

    if (!forceUpdate && !updateCheck.needsUpdate) {
      console.log(`✅ Product "${productData.title}" is already up to date in Stripe`)
      return {
        product: updateCheck.currentStripeData,
        price: null, // We don't need to return price if no changes
        action: "no_change",
      }
    }

    console.log(`📝 Update needed for "${productData.title}":`, updateCheck.reasons)

    let stripeProduct
    let action: "created" | "updated" = "created"

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
        last_updated: productData.updated_at || new Date().toISOString(),
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
      console.log(`➕ Creating new Stripe product: ${productData.title}`)
      stripeProduct = await stripe.products.create(stripeProductData)
      action = "created"
    } else {
      console.log(`🔄 Updating existing Stripe product: ${productData.title}`)
      stripeProduct = await stripe.products.update(productData.stripe_product_id, stripeProductData)
      action = "updated"
    }

    // Handle pricing - always create new price for updates (Stripe prices are immutable)
    const unitAmountCents = Math.round(productData.selling_price * 100)
    console.log(`💰 Creating Stripe price: $${productData.selling_price} (${unitAmountCents} cents)`)

    const stripePrice = await stripe.prices.create({
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

    console.log(`✅ Successfully ${action} product: ${productData.title}`)

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

// Get ALL products for display
export const getAllProductsWithSyncStatus = async (): Promise<ProductData[]> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
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

    return products || []
  } catch (error) {
    console.error("Error in getAllProductsWithSyncStatus:", error)
    return []
  }
}

// Get products that need syncing (including updates)
export const getProductsForSync = async (): Promise<ProductData[]> => {
  try {
    const allProducts = await getAllProductsWithSyncStatus()
    const productsNeedingSync: ProductData[] = []

    for (const product of allProducts) {
      const updateCheck = await needsStripeUpdate(product)
      if (updateCheck.needsUpdate) {
        productsNeedingSync.push(product)
      }
    }

    console.log(`Found ${productsNeedingSync.length} products needing sync out of ${allProducts.length} total`)
    return productsNeedingSync
  } catch (error) {
    console.error("Error in getProductsForSync:", error)
    return []
  }
}

// Enhanced sync function with better tracking
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
    console.log("🚀 Starting enhanced Stripe product sync...")

    // Get products that need syncing
    const products = forceUpdate ? await getAllProductsWithSyncStatus() : await getProductsForSync()

    if (products.length === 0) {
      console.log("✅ No products need syncing")
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

// Force sync a specific product (for testing)
export const forceSyncProduct = async (
  productId: string,
): Promise<{
  success: boolean
  action?: "created" | "updated" | "no_change"
  error?: string
}> => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: product, error } = await supabaseAdmin.from("products").select("*").eq("id", productId).single()

    if (error || !product) {
      throw new Error(`Product not found: ${productId}`)
    }

    const result = await createOrUpdateStripeProduct(product, true)

    return {
      success: true,
      action: result.action,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
