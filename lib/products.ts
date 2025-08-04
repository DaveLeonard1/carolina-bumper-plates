import { createSupabaseAdmin } from "@/lib/supabase"
import type { Product } from "@/lib/supabase"

// Server-side product fetching for homepage
export async function getProducts(): Promise<Product[]> {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("available", true)
      .order("weight", { ascending: true })

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    return products || []
  } catch (error) {
    console.error("Unexpected error fetching products:", error)
    return []
  }
}

// Client-side product fetching with caching
export async function fetchProductsClient(): Promise<Product[]> {
  try {
    const response = await fetch("/api/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Prevent caching issues
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.products || []
  } catch (error) {
    console.error("Error fetching products from API:", error)
    return []
  }
}

// Transform products for homepage display
export function transformProductsForHomepage(products: Product[]) {
  return products.map((product) => ({
    weight: product.weight,
    price: product.selling_price,
    quantity: 0, // Default quantity for homepage
    regularPrice: product.regular_price,
    title: product.title,
    description: product.description,
    available: product.available,
    savings: {
      amount: product.regular_price - product.selling_price,
      percentage: Math.round(((product.regular_price - product.selling_price) / product.regular_price) * 100),
    },
  }))
}
