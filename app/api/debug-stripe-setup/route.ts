import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Check if products table exists
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "products")

    if (tablesError || !tables || tables.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Products table does not exist",
        tables: [],
        columns: [],
        stripeSettings: null,
        products: [],
      })
    }

    // Check products table columns
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "products")
      .order("ordinal_position")

    // Check for Stripe-specific columns
    const stripeColumns = ["stripe_product_id", "stripe_price_id", "stripe_synced_at", "stripe_active"]
    const existingStripeColumns = columns?.filter((col) => stripeColumns.includes(col.column_name)) || []

    // Check stripe_settings table
    let stripeSettings = null
    try {
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from("stripe_settings")
        .select("*")
        .eq("id", 1)
        .single()

      if (!settingsError && settings) {
        stripeSettings = settings
      }
    } catch (settingsError) {
      console.log("stripe_settings table does not exist or is empty")
    }

    // Get sample products
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, title, weight, selling_price, available")
      .eq("available", true)
      .gt("weight", 0)
      .gt("selling_price", 0)
      .order("weight")
      .limit(5)

    return NextResponse.json({
      success: true,
      tables: tables.map((t) => t.table_name),
      columns: columns || [],
      stripeColumns: {
        required: stripeColumns,
        existing: existingStripeColumns.map((col) => col.column_name),
        missing: stripeColumns.filter(
          (required) => !existingStripeColumns.some((existing) => existing.column_name === required),
        ),
      },
      stripeSettings,
      products: products || [],
      diagnosis: {
        hasProductsTable: true,
        hasAllStripeColumns: existingStripeColumns.length === stripeColumns.length,
        hasStripeSettings: !!stripeSettings,
        hasProducts: (products?.length || 0) > 0,
        readyForSync:
          existingStripeColumns.length === stripeColumns.length && !!stripeSettings && (products?.length || 0) > 0,
      },
    })
  } catch (error) {
    console.error("Error in debug-stripe-setup:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tables: [],
        columns: [],
        stripeSettings: null,
        products: [],
      },
      { status: 500 },
    )
  }
}
