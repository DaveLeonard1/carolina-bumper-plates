import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Debug Homepage Products: Starting comprehensive check...")
    const supabaseAdmin = createSupabaseAdmin()

    // Test 1: Check if products table exists and get structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc("get_table_info", {
        table_name: "products",
      })
      .catch(async () => {
        // Fallback: Try to query the table directly
        const { data, error } = await supabaseAdmin.from("products").select("*").limit(1)

        return { data: data ? ["Table exists"] : null, error }
      })

    console.log("📋 Table structure check:", { tableInfo, tableError })

    // Test 2: Get all products (including unavailable ones)
    const { data: allProducts, error: allProductsError } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("weight", { ascending: true })

    console.log("📦 All products query:", {
      count: allProducts?.length || 0,
      error: allProductsError?.message || null,
    })

    // Test 3: Get only available products (what the API should return)
    const { data: availableProducts, error: availableError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("available", true)
      .order("weight", { ascending: true })

    console.log("✅ Available products query:", {
      count: availableProducts?.length || 0,
      error: availableError?.message || null,
    })

    // Test 4: Analyze data quality
    const dataQualityReport =
      allProducts?.map((product) => ({
        id: product.id,
        title: product.title,
        weight: product.weight,
        selling_price: product.selling_price,
        regular_price: product.regular_price,
        available: product.available,
        issues: [
          !product.title ? "Missing title" : null,
          !product.weight || product.weight <= 0 ? "Invalid weight" : null,
          !product.selling_price || product.selling_price <= 0 ? "Invalid selling price" : null,
          !product.regular_price || product.regular_price <= 0
            ? "Invalid regular price' :  : null,\
        !product.regular_price || product.regular_price <= 0 ? 'Invalid regular price"
            : null,
          !product.available ? "Not available" : null,
        ].filter(Boolean),
      })) || []

    // Test 5: Create sample products if none exist
    if (!availableProducts || availableProducts.length === 0) {
      console.log("🔧 No products found, creating sample products...")

      const sampleProducts = [
        {
          title: "10 LB Hi-Temp Bumper Plates (Pair)",
          weight: 10,
          selling_price: 45.0,
          regular_price: 60.0,
          description:
            "Factory-second Hi-Temp 10 lb bumper plates with minor cosmetic blemishes. Fully functional and structurally sound.",
          available: true,
        },
        {
          title: "15 LB Hi-Temp Bumper Plates (Pair)",
          weight: 15,
          selling_price: 55.0,
          regular_price: 75.0,
          description:
            "Factory-second Hi-Temp 15 lb bumper plates with minor cosmetic blemishes. Fully functional and structurally sound.",
          available: true,
        },
        {
          title: "25 LB Hi-Temp Bumper Plates (Pair)",
          weight: 25,
          selling_price: 75.0,
          regular_price: 100.0,
          description:
            "Factory-second Hi-Temp 25 lb bumper plates with minor cosmetic blemishes. Fully functional and structurally sound.",
          available: true,
        },
        {
          title: "35 LB Hi-Temp Bumper Plates (Pair)",
          weight: 35,
          selling_price: 95.0,
          regular_price: 125.0,
          description:
            "Factory-second Hi-Temp 35 lb bumper plates with minor cosmetic blemishes. Fully functional and structurally sound.",
          available: true,
        },
        {
          title: "45 LB Hi-Temp Bumper Plates (Pair)",
          weight: 45,
          selling_price: 115.0,
          regular_price: 150.0,
          description:
            "Factory-second Hi-Temp 45 lb bumper plates with minor cosmetic blemishes. Fully functional and structurally sound.",
          available: true,
        },
      ]

      const { data: insertedProducts, error: insertError } = await supabaseAdmin
        .from("products")
        .insert(sampleProducts)
        .select()

      console.log("📝 Sample products created:", {
        count: insertedProducts?.length || 0,
        error: insertError?.message || null,
      })
    }

    // Test 6: Final verification - re-fetch available products
    const { data: finalProducts, error: finalError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("available", true)
      .order("weight", { ascending: true })

    console.log("🎯 Final products verification:", {
      count: finalProducts?.length || 0,
      error: finalError?.message || null,
    })

    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          tableExists: !tableError,
          allProductsCount: allProducts?.length || 0,
          availableProductsCount: availableProducts?.length || 0,
          finalProductsCount: finalProducts?.length || 0,
          dataQualityReport,
          sampleProducts: finalProducts?.slice(0, 3) || [],
          errors: {
            tableError: tableError?.message || null,
            allProductsError: allProductsError?.message || null,
            availableError: availableError?.message || null,
            finalError: finalError?.message || null,
          },
        },
        products: finalProducts || [],
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("💥 Debug Homepage Products error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Debug check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: null,
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
