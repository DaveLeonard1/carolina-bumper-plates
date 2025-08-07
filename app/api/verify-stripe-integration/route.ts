import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createSupabaseAdmin } from "@/lib/supabase"
import { getStripeConfig } from "@/lib/stripe-config"

// Define types for the verification results
interface VerificationResults {
  timestamp: string
  stripe_connection: boolean
  webhook_secret: boolean
  database_connection: boolean
  recent_webhooks: any[]
  recent_payments: any[]
  configuration_issues: string[]
  recommendations: string[]
}

export async function GET() {
  try {
    console.log("🔍 Verifying Stripe integration...")

    const results: VerificationResults = {
      timestamp: new Date().toISOString(),
      stripe_connection: false,
      webhook_secret: false,
      database_connection: false,
      recent_webhooks: [],
      recent_payments: [],
      configuration_issues: [],
      recommendations: [],
    }

    // 1. Test Stripe connection
    try {
      const stripe = await getStripe()
      const account = await stripe.accounts.retrieve()
      results.stripe_connection = true
      console.log("✅ Stripe connection successful")
    } catch (error) {
      results.configuration_issues.push("Stripe connection failed: " + (error as Error).message)
      console.error("❌ Stripe connection failed:", error)
    }

    // 2. Check webhook secret
    try {
      // Get webhook secret from centralized config
      const { webhookSecret } = await getStripeConfig()
      
      if (webhookSecret) {
        results.webhook_secret = true
        console.log("✅ Webhook secret configured")
      } else {
        results.configuration_issues.push("Webhook secret not configured in options or environment variables")
        console.error("❌ Webhook secret not configured")
      }
    } catch (error) {
      results.configuration_issues.push("Webhook secret error: " + (error as Error).message)
      console.error("❌ Webhook secret error:", error)
    }

    // 3. Test database connection
    try {
      const supabase = createSupabaseAdmin()
      const { data, error } = await supabase.from("orders").select("count").limit(1)
      if (!error) {
        results.database_connection = true
        console.log("✅ Database connection successful")
      } else {
        results.configuration_issues.push("Database connection error: " + error.message)
      }
    } catch (error) {
      results.configuration_issues.push("Database connection failed: " + (error as Error).message)
      console.error("❌ Database connection failed:", error)
    }

    // 4. Check recent webhook activity (if database is connected)
    if (results.database_connection) {
      try {
        const supabase = createSupabaseAdmin()

        // Check for recent webhook logs
        const { data: webhookLogs } = await supabase
          .from("webhook_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        results.recent_webhooks = webhookLogs || []

        // Check for recent payments
        const { data: recentPayments } = await supabase
          .from("orders")
          .select("order_number, status, payment_status, paid_at, stripe_checkout_session_id")
          .eq("payment_status", "paid")
          .order("paid_at", { ascending: false })
          .limit(5)

        results.recent_payments = recentPayments || []

        console.log(`📊 Found ${results.recent_webhooks.length} recent webhooks`)
        console.log(`💰 Found ${results.recent_payments.length} recent payments`)
      } catch (error) {
        console.warn("⚠️ Could not fetch webhook/payment history:", error)
      }
    }

    // 5. Generate recommendations
    if (!results.stripe_connection) {
      results.recommendations.push("Configure Stripe API keys in environment variables")
    }

    if (!results.webhook_secret) {
      results.recommendations.push("Set webhook secret in environment variables or options table")
      results.recommendations.push("Configure webhook endpoint in Stripe Dashboard: /api/stripe/webhook")
    }

    if (!results.database_connection) {
      results.recommendations.push("Verify Supabase connection and credentials")
    }

    if (results.recent_webhooks.length === 0) {
      results.recommendations.push("Test webhook delivery by creating a test payment")
    }

    if (results.recent_payments.length === 0) {
      results.recommendations.push("Verify payment flow is working end-to-end")
    }

    // 6. Overall health assessment
    const healthScore = [results.stripe_connection, results.webhook_secret, results.database_connection].filter(
      Boolean,
    ).length

    const overallStatus = healthScore === 3 ? "HEALTHY" : healthScore === 2 ? "NEEDS_ATTENTION" : "CRITICAL"

    console.log(`🏥 Integration health: ${overallStatus} (${healthScore}/3)`)

    return NextResponse.json({
      status: overallStatus,
      health_score: `${healthScore}/3`,
      ...results,
    })
  } catch (error) {
    console.error("🚨 Integration verification failed:", error)
    return NextResponse.json(
      {
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
