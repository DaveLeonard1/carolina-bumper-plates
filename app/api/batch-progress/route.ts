import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

// In-memory cache
let cachedData: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Function to clear cache (exported for use in other routes)
export function clearCache() {
  cachedData = null
  cacheTimestamp = 0
}

export async function GET() {
  try {
    // Return cached data if still fresh
    const now = Date.now()
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      })
    }

    const supabase = createSupabaseAdmin()

    // Get settings from options table
    const { data: optionData, error: optionError } = await supabase
      .from("options")
      .select("option_name, option_value")
      .in("option_name", ["minimum_order_weight", "batch_progress_offset"])

    if (optionError) {
      console.error("Failed to fetch settings:", optionError)
      // Return cached data if available, even if expired
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          cached: true,
          stale: true,
        })
      }
      return NextResponse.json(
        { success: false, error: "Failed to fetch settings" },
        { status: 500 }
      )
    }

    // Parse settings
    const settingsMap = new Map(optionData?.map(item => [item.option_name, item.option_value]))
    const minimumOrderWeight = parseInt(settingsMap.get("minimum_order_weight") || "7000")
    const batchProgressOffset = parseInt(settingsMap.get("batch_progress_offset") || "0")

    // Get total weight of all pending orders (not yet paid)
    // Only select the fields we need for better performance
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total_weight")
      .in("status", ["pending", "quote_sent", "payment_link_sent"])
      .eq("payment_status", "unpaid")

    if (ordersError) {
      console.error("Failed to fetch pending orders:", ordersError)
      // Return cached data if available
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          cached: true,
          stale: true,
        })
      }
      return NextResponse.json(
        { success: false, error: "Failed to fetch pending orders" },
        { status: 500 }
      )
    }

    // Calculate total weight of pending orders
    const actualWeight = orders?.reduce((sum, order) => sum + (order.total_weight || 0), 0) || 0
    const currentWeight = actualWeight + batchProgressOffset
    const percentage = Math.min((currentWeight / minimumOrderWeight) * 100, 100)
    const remaining = Math.max(minimumOrderWeight - currentWeight, 0)
    const orderCount = orders?.length || 0

    const result = {
      currentWeight,
      goalWeight: minimumOrderWeight,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
      remaining,
      orderCount,
      isGoalMet: currentWeight >= minimumOrderWeight,
    }

    // Update cache
    cachedData = result
    cacheTimestamp = now

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    })
  } catch (error) {
    console.error("Batch progress error:", error)
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching batch progress" },
      { status: 500 }
    )
  }
}

// DELETE endpoint to clear cache
export async function DELETE() {
  try {
    clearCache()
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    )
  }
}
