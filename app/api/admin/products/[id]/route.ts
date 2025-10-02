import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { weight, title, selling_price, regular_price, cost, available, description } = body
    const productId = params.id

    if (!weight || !title || selling_price === undefined || regular_price === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["weight", "title", "selling_price", "regular_price"],
        },
        { status: 400 },
      )
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update({
        weight: Number(weight),
        title: String(title).trim(),
        selling_price: Number(selling_price),
        regular_price: Number(regular_price),
        cost: cost ? Number(cost) : null,
        available: Boolean(available),
        description: description ? String(description).trim() : null,
      })
      .eq("id", productId)
      .select()
      .single()

    if (error) {
      console.error("Products PUT error:", error)
      return NextResponse.json(
        {
          error: "Failed to update product",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error("Products PUT unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const productId = params.id

    const { error } = await supabaseAdmin.from("products").delete().eq("id", productId)

    if (error) {
      console.error("Products DELETE error:", error)
      return NextResponse.json(
        {
          error: "Failed to delete product",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Products DELETE unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
