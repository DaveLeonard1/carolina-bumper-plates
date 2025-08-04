import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Debug Products Structure API: Starting...")
    const supabaseAdmin = createSupabaseAdmin()

    // Get table structure
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_name", "products")
      .order("ordinal_position")

    console.log("📋 Products table columns:", columns)

    // Get sample data
    const { data: sampleProducts, error: productsError } = await supabaseAdmin.from("products").select("*").limit(3)

    console.log("📦 Sample products:", sampleProducts)

    // Get all products to see what we have
    const { data: allProducts, error: allError } = await supabaseAdmin.from("products").select("*")

    console.log("🛍️ All products:", allProducts)

    return new Response(
      JSON.stringify({
        success: true,
        tableStructure: {
          columns: columns || [],
          columnsError: columnsError?.message || null,
        },
        sampleData: {
          products: sampleProducts || [],
          productsError: productsError?.message || null,
        },
        allData: {
          products: allProducts || [],
          count: allProducts?.length || 0,
          allError: allError?.message || null,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("💥 Debug Products Structure error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
