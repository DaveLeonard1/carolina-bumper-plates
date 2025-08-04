import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function DELETE(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params
    console.log(`🧹 Cleaning up test order: ${orderId}`)

    const supabase = createSupabaseAdmin()

    // 1. Delete timeline events
    await supabase.from("order_timeline").delete().eq("order_id", orderId)

    // 2. Delete the order
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId)
      .eq("order_number", `TEST-${orderId}`) // Safety check

    if (deleteError) {
      throw new Error(`Failed to delete test order: ${deleteError.message}`)
    }

    console.log(`✅ Test order ${orderId} cleaned up successfully`)

    return NextResponse.json({
      success: true,
      message: `Test order ${orderId} has been cleaned up`,
    })
  } catch (error) {
    console.error("🚨 Test cleanup failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
