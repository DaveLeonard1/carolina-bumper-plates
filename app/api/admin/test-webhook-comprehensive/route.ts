import { type NextRequest, NextResponse } from "next/server"
import { webhookDebugger } from "@/lib/zapier-webhook-debug"
import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { testType, orderId, webhookUrl } = await request.json()

    console.log(`🧪 Starting comprehensive webhook test: ${testType}`)

    const supabase = createSupabaseAdmin()

    switch (testType) {
      case "configuration":
        return await testWebhookConfiguration()

      case "connectivity":
        return await testWebhookConnectivity(webhookUrl)

      case "full_diagnosis":
        if (!orderId) {
          return NextResponse.json({ success: false, error: "Order ID required for full diagnosis" }, { status: 400 })
        }
        return await runFullDiagnosis(orderId)

      case "payload_validation":
        if (!orderId) {
          return NextResponse.json(
            { success: false, error: "Order ID required for payload validation" },
            { status: 400 },
          )
        }
        return await testPayloadValidation(orderId)

      default:
        return NextResponse.json({ success: false, error: "Invalid test type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in comprehensive webhook test:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      },
      { status: 500 },
    )
  }
}

async function testWebhookConfiguration() {
  const supabase = createSupabaseAdmin()

  const { data: settings, error } = await supabase.from("zapier_settings").select("*").single()

  if (error || !settings) {
    return NextResponse.json({
      success: false,
      error: "Webhook configuration not found",
      details: { error },
    })
  }

  const issues: string[] = []
  const warnings: string[] = []

  if (!settings.webhook_enabled) {
    issues.push("Webhook integration is disabled")
  }

  if (!settings.webhook_url) {
    issues.push("Webhook URL is not configured")
  } else {
    try {
      const url = new URL(settings.webhook_url)
      if (url.protocol !== "https:") {
        warnings.push("Webhook URL should use HTTPS for security")
      }
    } catch {
      issues.push("Webhook URL format is invalid")
    }
  }

  if (settings.webhook_timeout < 5 || settings.webhook_timeout > 300) {
    warnings.push("Webhook timeout should be between 5-300 seconds")
  }

  return NextResponse.json({
    success: issues.length === 0,
    configuration: settings,
    issues,
    warnings,
    message: issues.length === 0 ? "Webhook configuration is valid" : `Found ${issues.length} configuration issues`,
  })
}

async function testWebhookConnectivity(webhookUrl: string) {
  if (!webhookUrl) {
    return NextResponse.json({
      success: false,
      error: "Webhook URL is required for connectivity test",
    })
  }

  try {
    const startTime = Date.now()

    const response = await fetch(webhookUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "Carolina-Bumper-Plates-Connectivity-Test/1.0",
      },
      signal: AbortSignal.timeout(10000),
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    return NextResponse.json({
      success: true,
      connectivity: {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        headers: Object.fromEntries(response.headers.entries()),
      },
      message: `Connectivity test successful (${responseTime}ms)`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Connectivity test failed",
      details: {
        type: error instanceof TypeError ? "network" : "unknown",
        code: (error as any)?.code,
      },
    })
  }
}

async function runFullDiagnosis(orderId: string) {
  try {
    const diagnosticResult = await webhookDebugger.diagnoseWebhookFailure(orderId)

    return NextResponse.json({
      success: true,
      diagnostic: diagnosticResult,
      message: `Full diagnosis completed for order ${orderId}`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Diagnosis failed",
    })
  }
}

async function testPayloadValidation(orderId: string) {
  const supabase = createSupabaseAdmin()

  try {
    // Get order data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        customers (
          id,
          email,
          first_name,
          last_name,
          phone,
          stripe_customer_id
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: "Order not found for payload validation",
      })
    }

    // Get webhook settings
    const { data: settings } = await supabase.from("zapier_settings").select("*").single()

    if (!settings) {
      return NextResponse.json({
        success: false,
        error: "Webhook settings not found",
      })
    }

    // Build test payload
    const payload = {
      event_type: "payment_link_created",
      timestamp: new Date().toISOString(),
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_link_url: order.payment_link_url,
        total_amount: order.total_amount || 0,
        currency: "USD",
        created_at: order.created_at,
      },
      metadata: {
        source: "payload_validation_test",
        created_via: "test",
        test_mode: true,
      },
    }

    // Validate payload structure
    const validationResults = {
      hasRequiredFields: !!(payload.order.id && payload.order.order_number && payload.order.payment_link_url),
      payloadSize: JSON.stringify(payload).length,
      isValidJson: true,
      structure: payload,
    }

    return NextResponse.json({
      success: validationResults.hasRequiredFields,
      validation: validationResults,
      payload: payload,
      message: validationResults.hasRequiredFields
        ? "Payload validation successful"
        : "Payload validation failed - missing required fields",
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Payload validation failed",
    })
  }
}
