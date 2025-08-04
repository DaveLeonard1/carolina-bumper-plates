import { NextResponse } from "next/server"

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    supabase: {},
    schema: {},
    errors: [],
  }

  try {
    // Check environment variables
    debugInfo.environment = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
    }

    // Try to create Supabase client
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      debugInfo.supabase.clientCreation = "✅ Success"

      // Test connection and get products
      try {
        const { data: products, error: productsError } = await supabase.from("products").select("*").limit(3)

        if (productsError) {
          debugInfo.supabase.query = "❌ Failed"
          debugInfo.supabase.error = {
            message: productsError.message,
            code: productsError.code,
            details: productsError.details,
            hint: productsError.hint,
          }
        } else {
          debugInfo.supabase.query = "✅ Success"
          debugInfo.supabase.productsCount = products?.length || 0

          // Check schema by examining the first product
          if (products && products.length > 0) {
            const firstProduct = products[0]
            debugInfo.schema = {
              actualColumns: Object.keys(firstProduct),
              expectedColumns: [
                "id",
                "weight",
                "title",
                "selling_price",
                "regular_price",
                "available",
                "description",
                "created_at",
                "updated_at",
              ],
              sampleData: firstProduct,
            }

            // Check for required fields
            const requiredFields = ["id", "weight", "title", "selling_price", "regular_price", "available"]
            const missingFields = requiredFields.filter((field) => !(field in firstProduct))
            const extraFields = Object.keys(firstProduct).filter(
              (field) =>
                ![
                  "id",
                  "weight",
                  "title",
                  "selling_price",
                  "regular_price",
                  "available",
                  "description",
                  "created_at",
                  "updated_at",
                ].includes(field),
            )

            debugInfo.schema.missingFields = missingFields
            debugInfo.schema.extraFields = extraFields
            debugInfo.schema.schemaMatch = missingFields.length === 0 ? "✅ Schema matches" : "❌ Schema mismatch"
          }
        }

        // Test a simple insert to see what happens
        try {
          const testProduct = {
            weight: 999,
            title: "Test Product",
            selling_price: 1.0,
            regular_price: 2.0,
            available: true,
            description: "Test description",
          }

          const { data: insertTest, error: insertError } = await supabase
            .from("products")
            .insert([testProduct])
            .select()
            .single()

          if (insertError) {
            debugInfo.supabase.insertTest = "❌ Failed"
            debugInfo.supabase.insertError = {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint,
            }
          } else {
            debugInfo.supabase.insertTest = "✅ Success"
            debugInfo.supabase.insertedProduct = insertTest

            // Clean up test product
            await supabase.from("products").delete().eq("id", insertTest.id)
            debugInfo.supabase.cleanup = "✅ Test product removed"
          }
        } catch (insertError) {
          debugInfo.errors.push({
            step: "insert_test",
            error: insertError instanceof Error ? insertError.message : String(insertError),
          })
        }
      } catch (queryError) {
        debugInfo.errors.push({
          step: "products_query",
          error: queryError instanceof Error ? queryError.message : String(queryError),
        })
      }
    } catch (clientError) {
      debugInfo.errors.push({
        step: "client_creation",
        error: clientError instanceof Error ? clientError.message : String(clientError),
      })
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    debugInfo.errors.push({
      step: "main_try_catch",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(debugInfo, { status: 500 })
  }
}
