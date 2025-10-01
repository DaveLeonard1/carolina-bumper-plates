import { getStripe } from "./stripe"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripeConfig } from "./stripe-config"

export interface StripeProductData {
  id: string
  name: string
  description?: string
  price_per_lb: number
  weight: number
  stripe_product_id?: string
  stripe_price_id?: string
  image_url?: string
}

// Check if Stripe columns exist in products table
export const checkStripeColumnsExist = async () => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Try to query the stripe columns - if they don't exist, this will fail
    const { error } = await supabaseAdmin
      .from("products")
      .select("stripe_product_id, stripe_price_id, stripe_synced_at, stripe_active")
      .limit(1)

    return !error
  } catch (error) {
    return false
  }
}

export const createOrUpdateStripeProduct = async (productData: StripeProductData) => {
  try {
    const stripe = await getStripe()
    const config = await getStripeConfig()
    const supabaseAdmin = createSupabaseAdmin()

    // Validate required fields
    if (!productData.id) {
      throw new Error("Product ID is required")
    }
    if (!productData.weight || typeof productData.weight !== "number") {
      throw new Error("Product weight is required and must be a number")
    }
    if (!productData.price_per_lb || typeof productData.price_per_lb !== "number") {
      throw new Error("Product price_per_lb is required and must be a number")
    }

    console.log(
      `Processing product: ID=${productData.id}, Weight=${productData.weight}lb, Price=$${productData.price_per_lb}/lb`,
    )

    let stripeProduct
    let stripePrice

    // Check if product already exists in Stripe
    if (productData.stripe_product_id) {
      try {
        stripeProduct = await stripe.products.retrieve(productData.stripe_product_id)
      } catch (error) {
        console.log("Stripe product not found, creating new one")
        stripeProduct = null
      }
    }

    // Prepare product data with safe string conversion
    const productCreateData: any = {
      name: `${productData.weight}lb Bumper Plate`,
      description: productData.description || `Hi-Temp ${productData.weight}lb Bumper Plate - Factory Second`,
      metadata: {
        weight: productData.weight.toString(),
        product_id: productData.id.toString(),
        mode: config.mode || "sandbox",
        source: "carolina-bumper-plates",
      },
    }

    // Add image if available and valid
    if (productData.image_url && typeof productData.image_url === "string" && productData.image_url.trim()) {
      productCreateData.images = [productData.image_url.trim()]
    }

    // Create or update Stripe product
    if (!stripeProduct) {
      console.log(`Creating new Stripe product for ${productData.weight}lb plate...`)
      stripeProduct = await stripe.products.create(productCreateData)
    } else {
      console.log(`Updating existing Stripe product for ${productData.weight}lb plate...`)
      stripeProduct = await stripe.products.update(productData.stripe_product_id, productCreateData)
    }

    // Create price for the product (price per unit, not per lb)
    const unitPrice = Math.round(productData.price_per_lb * productData.weight * 100) // Convert to cents

    console.log(`Creating Stripe price: $${(unitPrice / 100).toFixed(2)} for ${productData.weight}lb plate`)

    stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: unitPrice,
      currency: "usd",
      metadata: {
        weight: productData.weight.toString(),
        price_per_lb: productData.price_per_lb.toString(),
        product_id: productData.id.toString(),
        mode: config.mode || "sandbox",
      },
    })

    // Check if Stripe columns exist before trying to update them
    const hasStripeColumns = await checkStripeColumnsExist()

    if (hasStripeColumns) {
      // Update database with Stripe IDs
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
        console.error("Failed to update product with Stripe IDs:", updateError)
      } else {
        console.log(`✅ Database updated for product ${productData.weight}lb`)
      }
    } else {
      console.warn("Stripe columns don't exist in products table - skipping database update")
    }

    return {
      product: stripeProduct,
      price: stripePrice,
    }
  } catch (error) {
    console.error(`Error creating/updating Stripe product for ${productData?.weight || "unknown"}lb:`, error)
    throw error
  }
}

export const syncAllProductsWithStripe = async (forceUpdate = false) => {
  const result = {
    success: true,
    processed: 0,
    succeeded: 0,
    failed: 0,
    created: 0,
    updated: 0,
    reused: 0,
    skipped: 0,
    errors: [] as Array<{ productId: string; error: string }>,
  }

  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Check if Stripe columns exist
    const hasStripeColumns = await checkStripeColumnsExist()

    let products
    if (hasStripeColumns) {
      // Query with Stripe columns if they exist - only get products with valid data
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .not("weight", "is", null)
        .not("price_per_lb", "is", null)
        .or("stripe_product_id.is.null,stripe_synced_at.is.null")

      if (error) {
        console.error("Error fetching products for sync:", error)
        result.success = false
        result.errors.push({ productId: "system", error: error.message })
        return result
      }
      products = data
    } else {
      // Query without Stripe columns if they don't exist - only get products with valid data
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .not("weight", "is", null)
        .not("price_per_lb", "is", null)

      if (error) {
        console.error("Error fetching products for sync:", error)
        result.success = false
        result.errors.push({ productId: "system", error: error.message })
        return result
      }
      products = data
    }

    if (!products || products.length === 0) {
      console.log("No valid products found to sync")
      return result
    }

    console.log(`Found ${products.length} valid products to sync with Stripe...`)
    result.processed = products.length

    for (const product of products) {
      try {
        // Double-check validation
        if (!product.id || !product.weight || !product.price_per_lb) {
          console.error(`❌ Skipping product with invalid data:`, product)
          result.skipped++
          continue
        }

        console.log(`Processing product: ${product.weight}lb plate (ID: ${product.id})...`)
        
        const stripeData = await createOrUpdateStripeProduct(product)
        
        if (stripeData) {
          result.succeeded++
          // Check if it was created or updated
          if (!product.stripe_product_id) {
            result.created++
          } else {
            result.updated++
          }
          console.log(`✅ Successfully synced product: ${product.weight}lb`)
        } else {
          result.failed++
          result.errors.push({ productId: product.id, error: "Sync returned no data" })
        }
      } catch (error) {
        console.error(`❌ Failed to sync product ${product.id} (${product.weight}lb):`, error)
        result.failed++
        result.errors.push({ 
          productId: product.id, 
          error: error instanceof Error ? error.message : "Unknown error" 
        })
      }
    }

    result.success = result.failed === 0
    console.log("Product sync completed:", result)
    return result
  } catch (error) {
    console.error("Error in syncAllProductsWithStripe:", error)
    result.success = false
    result.errors.push({ 
      productId: "system", 
      error: error instanceof Error ? error.message : "Unknown error" 
    })
    return result
  }
}

export const getStripeProductForWeight = async (weight: number) => {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: product, error } = await supabaseAdmin.from("products").select("*").eq("weight", weight).single()

    if (error || !product) {
      console.error("Product not found for weight:", weight)
      return null
    }

    // Validate product data
    if (!product.id || !product.weight || !product.price_per_lb) {
      console.error("Invalid product data:", product)
      return null
    }

    // Check if Stripe columns exist and if product needs syncing
    const hasStripeColumns = await checkStripeColumnsExist()

    if (hasStripeColumns && (!product.stripe_product_id || !product.stripe_price_id)) {
      console.log(`Syncing product ${weight}lb with Stripe...`)
      const stripeData = await createOrUpdateStripeProduct(product)
      return {
        ...product,
        stripe_product_id: stripeData.product.id,
        stripe_price_id: stripeData.price.id,
      }
    } else if (!hasStripeColumns) {
      // If no Stripe columns, always sync to Stripe but don't update database
      console.log(`Creating Stripe product for ${weight}lb (no database sync)...`)
      const stripeData = await createOrUpdateStripeProduct(product)
      return {
        ...product,
        stripe_product_id: stripeData.product.id,
        stripe_price_id: stripeData.price.id,
      }
    }

    return product
  } catch (error) {
    console.error("Error getting Stripe product for weight:", error)
    return null
  }
}

// Additional helper functions for admin sync page
export const checkSyncHealth = async () => {
  const supabaseAdmin = createSupabaseAdmin()
  const config = await getStripeConfig()
  
  const issues: string[] = []
  const databaseReady = await checkStripeColumnsExist()
  
  if (!databaseReady) {
    issues.push("Stripe columns missing from products table")
  }
  
  // Check if Stripe is configured (has keys)
  const stripeConfigured = !!(config.secretKey && config.publishableKey)
  if (!stripeConfigured) {
    issues.push("Stripe keys not configured")
  }
  
  return {
    databaseReady,
    stripeConfigured,
    taxCode: "txcd_99999999", // Default tax code for physical goods
    issues,
    columnInfo: databaseReady ? "Stripe columns exist" : "Stripe columns missing",
  }
}

export const getAllProductsWithSyncStatus = async () => {
  const supabaseAdmin = createSupabaseAdmin()
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("weight", { ascending: true })
  
  return products || []
}
