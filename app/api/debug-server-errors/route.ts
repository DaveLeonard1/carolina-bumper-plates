import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const errors: any[] = []
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    errors: [],
    warnings: [],
    database_status: "unknown",
    stripe_status: "unknown",
    supabase_status: "unknown",
  }

  try {
    // Test database connection
    try {
      const supabaseAdmin = createSupabaseAdmin()
      const { data, error } = await supabaseAdmin.from("orders").select("count").limit(1)

      if (error) {
        diagnostics.database_status = "error"
        diagnostics.errors.push({
          type: "DATABASE_ERROR",
          message: error.message,
          details: error,
          timestamp: new Date().toISOString(),
        })
      } else {
        diagnostics.database_status = "connected"
      }
    } catch (dbError) {
      diagnostics.database_status = "error"
      diagnostics.errors.push({
        type: "DATABASE_CONNECTION_ERROR",
        message: dbError instanceof Error ? dbError.message : "Unknown database error",
        timestamp: new Date().toISOString(),
      })
    }

    // Test Stripe configuration
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY
      if (!stripeKey) {
        diagnostics.stripe_status = "missing_config"
        diagnostics.warnings.push({
          type: "STRIPE_CONFIG_WARNING",
          message: "No Stripe secret key found in environment variables",
          timestamp: new Date().toISOString(),
        })
      } else {
        diagnostics.stripe_status = "configured"
      }
    } catch (stripeError) {
      diagnostics.stripe_status = "error"
      diagnostics.errors.push({
        type: "STRIPE_CONFIG_ERROR",
        message: stripeError instanceof Error ? stripeError.message : "Unknown Stripe error",
        timestamp: new Date().toISOString(),
      })
    }

    // Test Supabase configuration
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        diagnostics.supabase_status = "missing_config"
        diagnostics.warnings.push({
          type: "SUPABASE_CONFIG_WARNING",
          message: "Missing Supabase configuration",
          details: {
            has_url: !!supabaseUrl,
            has_service_key: !!supabaseKey,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        diagnostics.supabase_status = "configured"
      }
    } catch (supabaseError) {
      diagnostics.supabase_status = "error"
      diagnostics.errors.push({
        type: "SUPABASE_CONFIG_ERROR",
        message: supabaseError instanceof Error ? supabaseError.message : "Unknown Supabase error",
        timestamp: new Date().toISOString(),
      })
    }

    // Test critical API endpoints
    const criticalEndpoints = ["/api/products", "/api/admin/orders", "/api/admin/customers"]

    for (const endpoint of criticalEndpoints) {
      try {
        // Note: We can't actually test these from here due to circular dependencies
        // This would be better done with external monitoring
        diagnostics.warnings.push({
          type: "ENDPOINT_TEST_SKIPPED",
          message: `Endpoint ${endpoint} test skipped (requires external testing)`,
          timestamp: new Date().toISOString(),
        })
      } catch (endpointError) {
        diagnostics.errors.push({
          type: "ENDPOINT_ERROR",
          message: `Error testing ${endpoint}`,
          details: endpointError instanceof Error ? endpointError.message : "Unknown error",
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Check environment variables
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_PUBLISHABLE_KEY",
    ]

    const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

    if (missingEnvVars.length > 0) {
      diagnostics.warnings.push({
        type: "MISSING_ENV_VARS",
        message: "Missing required environment variables",
        details: { missing: missingEnvVars },
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      summary: {
        total_errors: diagnostics.errors.length,
        total_warnings: diagnostics.warnings.length,
        database_status: diagnostics.database_status,
        stripe_status: diagnostics.stripe_status,
        supabase_status: diagnostics.supabase_status,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        diagnostics,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  // This endpoint can be used to test specific functionality
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  }

  try {
    // Test 1: Database schema validation
    try {
      const supabaseAdmin = createSupabaseAdmin()

      // Check if required tables exist
      const requiredTables = ["orders", "products", "customers", "order_timeline", "stripe_settings"]

      for (const table of requiredTables) {
        try {
          const { data, error } = await supabaseAdmin.from(table).select("*").limit(1)
          testResults.tests.push({
            test: `table_${table}`,
            status: error ? "FAIL" : "PASS",
            error: error?.message,
          })
        } catch (tableError) {
          testResults.tests.push({
            test: `table_${table}`,
            status: "FAIL",
            error: tableError instanceof Error ? tableError.message : "Unknown error",
          })
        }
      }
    } catch (schemaError) {
      testResults.tests.push({
        test: "database_schema",
        status: "FAIL",
        error: schemaError instanceof Error ? schemaError.message : "Unknown error",
      })
    }

    // Test 2: Order data integrity
    try {
      const supabaseAdmin = createSupabaseAdmin()
      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, order_items, customer_email")
        .limit(5)

      if (error) {
        testResults.tests.push({
          test: "order_data_integrity",
          status: "FAIL",
          error: error.message,
        })
      } else {
        const issues = []

        orders?.forEach((order) => {
          if (!order.order_number) issues.push(`Order ${order.id} missing order_number`)
          if (!order.customer_email) issues.push(`Order ${order.id} missing customer_email`)

          // Try to parse order_items
          try {
            if (typeof order.order_items === "string") {
              JSON.parse(order.order_items)
            }
          } catch {
            issues.push(`Order ${order.id} has invalid order_items JSON`)
          }
        })

        testResults.tests.push({
          test: "order_data_integrity",
          status: issues.length > 0 ? "WARN" : "PASS",
          issues: issues,
          orders_checked: orders?.length || 0,
        })
      }
    } catch (orderError) {
      testResults.tests.push({
        test: "order_data_integrity",
        status: "FAIL",
        error: orderError instanceof Error ? orderError.message : "Unknown error",
      })
    }

    return NextResponse.json({
      success: true,
      testResults,
      summary: {
        total_tests: testResults.tests.length,
        passed: testResults.tests.filter((t: any) => t.status === "PASS").length,
        failed: testResults.tests.filter((t: any) => t.status === "FAIL").length,
        warnings: testResults.tests.filter((t: any) => t.status === "WARN").length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        testResults,
      },
      { status: 500 },
    )
  }
}
