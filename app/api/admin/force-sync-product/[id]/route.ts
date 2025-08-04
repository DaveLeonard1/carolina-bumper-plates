import { type NextRequest, NextResponse } from "next/server"
import { forceSyncProduct } from "@/lib/stripe-products-v4"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    console.log(`🔄 Force syncing product: ${productId}`)

    const result = await forceSyncProduct(productId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Product ${result.action} successfully`,
        action: result.action,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ Error in force sync:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
