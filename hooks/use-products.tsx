"use client"

import { useState, useEffect, useCallback } from "react"
import type { Product } from "@/lib/supabase"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchProducts = useCallback(async (force = false) => {
    try {
      console.log("🔄 useProducts: Starting fetch...")
      setLoading(true)
      setError(null)

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/products?t=${timestamp}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      console.log("📡 useProducts: API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ useProducts: API error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📦 useProducts: API response data:", {
        success: data.success,
        count: data.count,
        productsLength: data.products?.length || 0,
      })

      if (!data.success) {
        console.error("❌ useProducts: API returned error:", data.error)
        throw new Error(data.error || "Failed to fetch products")
      }

      const fetchedProducts = data.products || []
      console.log("✅ useProducts: Successfully fetched", fetchedProducts.length, "products")

      // Additional validation on client side
      const validProducts = fetchedProducts.filter((product: any) => {
        const isValid =
          product.id &&
          product.title &&
          typeof product.selling_price === "number" &&
          !isNaN(product.selling_price) &&
          product.selling_price > 0 &&
          typeof product.weight === "number" &&
          !isNaN(product.weight) &&
          product.weight > 0

        if (!isValid) {
          console.warn("⚠️ useProducts: Invalid product filtered out:", product)
        }

        return isValid
      })

      console.log("✅ useProducts: Valid products after client filtering:", validProducts.length)

      setProducts(validProducts)
      setLastFetch(new Date())
      setError(null)
    } catch (err) {
      console.error("💥 useProducts: Fetch error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    console.log("🔄 useProducts: Manual refresh triggered")
    fetchProducts(true)
  }, [fetchProducts])

  useEffect(() => {
    console.log("🚀 useProducts: Initial fetch on mount")
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    refresh,
    lastFetch,
  }
}
