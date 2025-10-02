import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

// In-memory cache (short duration since DB cache is instant)
let cachedData: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 30 * 1000 // 30 seconds - DB cache is already fast!

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

    // Fetch data in parallel for speed
    const [settingsResult, cacheResult] = await Promise.all([
      supabase
        .from("options")
        .select("option_name, option_value")
        .in("option_name", ["minimum_order_weight", "batch_progress_offset"]),
      supabase
        .from("batch_progress_cache")
        .select("total_weight, order_count")
        .eq("id", 1)
        .single()
    ])

    if (settingsResult.error) {
      console.error("Failed to fetch settings:", settingsResult.error)
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
        { success: false, error: "Failed to fetch settings" },
        { status: 500 }
      )
    }

    if (cacheResult.error) {
      console.error("Failed to fetch batch cache:", cacheResult.error)
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
        { success: false, error: "Failed to fetch batch progress cache" },
        { status: 500 }
      )
    }

    // Parse settings
    const settingsMap = new Map(settingsResult.data?.map(item => [item.option_name, item.option_value]))
    const minimumOrderWeight = parseInt(settingsMap.get("minimum_order_weight") || "7000")
    const batchProgressOffset = parseInt(settingsMap.get("batch_progress_offset") || "0")

    // Get cached totals (instant, no aggregation!)
    const actualWeight = cacheResult.data?.total_weight || 0
    const orderCount = cacheResult.data?.order_count || 0
    const currentWeight = actualWeight + batchProgressOffset
    const percentage = Math.min((currentWeight / minimumOrderWeight) * 100, 100)
    const remaining = Math.max(minimumOrderWeight - currentWeight, 0)

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
