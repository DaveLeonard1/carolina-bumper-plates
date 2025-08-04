import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    const { data: settings, error } = await supabaseAdmin.from("stripe_settings").select("*").single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Get stripe settings error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get settings",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { default_tax_code } = body

    if (!default_tax_code) {
      return NextResponse.json(
        {
          success: false,
          error: "default_tax_code is required",
        },
        { status: 400 },
      )
    }

    const supabaseAdmin = createSupabaseAdmin()

    const { data: settings, error } = await supabaseAdmin
      .from("stripe_settings")
      .update({
        default_tax_code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      settings,
      message: `Tax code updated to ${default_tax_code}`,
    })
  } catch (error) {
    console.error("Update stripe settings error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update settings",
      },
      { status: 500 },
    )
  }
}
