import { type NextRequest, NextResponse } from "next/server"
import { createInvoiceWithComprehensiveDebug } from "@/lib/stripe-invoice-comprehensive-debug"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    console.log("\n🚀 STARTING COMPREHENSIVE INVOICE DEBUG SESSION")
    console.log("=".repeat(60))

    const result = await createInvoiceWithComprehensiveDebug(orderId)

    console.log("\n📋 DEBUG SESSION COMPLETE")
    console.log("=".repeat(60))
    console.log(`✅ Success: ${result.success}`)
    console.log(`📊 Total Log Entries: ${result.logs.length}`)
    console.log(`🎯 Recommendations: ${result.debug_summary.recommendations.length}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 COMPREHENSIVE DEBUG FAILED:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs: [],
      debug_summary: {
        order_analysis: null,
        product_sync_status: null,
        stripe_integration: null,
        recommendations: ["Critical error in debug system - check server logs"],
      },
    })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({
    message: "Use POST method to run comprehensive invoice debug",
    order_id: params.id,
    endpoint: `/api/comprehensive-invoice-debug/${params.id}`,
  })
}
