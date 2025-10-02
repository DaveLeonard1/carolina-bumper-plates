import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Products API: Starting fetch...")
    const supabaseAdmin = createSupabaseAdmin()

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("available", true)
      .order("weight", { ascending: true })

    console.log("📦 Products API: Raw database response:", {
      productsCount: products?.length || 0,
      error: error?.message || null,
    })

    if (error) {
      console.error("❌ Products API error:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch products",
          details: error.message,
          products: [],
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    if (!products || products.length === 0) {
      console.warn("⚠️ No products found in database")
      return new Response(
        JSON.stringify({
          success: true,
          products: [],
          count: 0,
          message: "No products available",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    // Log the actual structure of the first product to understand the schema
    console.log("🔍 First product structure:", Object.keys(products[0]))
    console.log("🔍 Sample product data:", {
      id: products[0].id,
      title: products[0].title,
      weight: products[0].weight,
      selling_price: products[0].selling_price,
      regular_price: products[0].regular_price,
      available: products[0].available,
    })

    // Normalize products to ensure consistent interface - PRESERVE EXACT FIELD NAMES
    const normalizedProducts = products.map((product) => ({
      id: product.id,
      title: product.title || `${product.weight} lb Bumper Plates`,
      weight: Number(product.weight) || 0,
      selling_price: Number(product.selling_price) || 0,
      regular_price: Number(product.regular_price) || 0,
      description: product.description || "",
      available: Boolean(product.available),
      created_at: product.created_at || "",
      updated_at: product.updated_at || "",
      image_url: product.image_url || null,
      // Add fields for modify-order compatibility
      name: product.title || `${product.weight} lb Bumper Plates`,
      price: Number(product.selling_price) || 0,
      regularPrice: Number(product.regular_price) || 0,
    }))

    // Validate normalized products
    const validProducts = normalizedProducts.filter((product) => {
      const isValid =
        product.id &&
        product.title &&
        product.weight > 0 &&
        product.selling_price > 0 &&
        product.regular_price > 0 &&
        product.available

      if (!isValid) {
        console.warn("⚠️ Invalid product filtered out:", {
          id: product.id,
          title: product.title,
          weight: product.weight,
          selling_price: product.selling_price,
          regular_price: product.regular_price,
          available: product.available,
        })
      }

      return isValid
    })

    console.log("✅ Products API: Successfully processed", validProducts.length, "valid products")
    console.log(
      "💰 Product prices:",
      validProducts.map((p) => ({ weight: p.weight, selling_price: p.selling_price, price: p.price })),
    )

    return new Response(
      JSON.stringify({
        success: true,
        products: validProducts,
        count: validProducts.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("💥 Products API unexpected error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        products: [],
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}
