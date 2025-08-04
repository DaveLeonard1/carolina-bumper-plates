import { NextResponse } from "next/server"
import { analyzeDuplicatePrices, fixAllDuplicatePrices, fixDuplicatePricesForProduct } from "@/lib/stripe-duplicate-fix"

export async function GET() {
  try {
    console.log("Analyzing duplicate prices...")

    const analysis = await analyzeDuplicatePrices()
    const duplicateCount = analysis.filter((a) => a.hasDuplicates).length
    const totalDuplicatePrices = analysis.reduce((sum, a) => sum + Math.max(0, a.activePrices.length - 1), 0)

    return NextResponse.json({
      success: true,
      analysis,
      summary: {
        totalProducts: analysis.length,
        productsWithDuplicates: duplicateCount,
        totalDuplicatePrices,
        needsCleanup: duplicateCount > 0,
      },
    })
  } catch (error) {
    console.error("Error analyzing duplicate prices:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        analysis: [],
        summary: {
          totalProducts: 0,
          productsWithDuplicates: 0,
          totalDuplicatePrices: 0,
          needsCleanup: false,
        },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, productId } = body

    if (action === "fix-all") {
      console.log("Starting bulk duplicate price cleanup...")
      const result = await fixAllDuplicatePrices()

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Successfully fixed ${result.totalFixed} products, archived ${result.totalArchivedPrices} duplicate prices`
          : `Completed with errors: ${result.errors.length} failures`,
        ...result,
      })
    }

    if (action === "fix-single" && productId) {
      console.log(`Fixing duplicate prices for product ${productId}...`)
      const result = await fixDuplicatePricesForProduct(productId)

      return NextResponse.json({
        success: result.success,
        message: result.message,
        archivedPrices: result.archivedPrices,
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action or missing productId" }, { status: 400 })
  } catch (error) {
    console.error("Error in fix-duplicate-prices POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
