import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    // Get webhook URL from settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "zapier_webhook_url")
      .single()

    if (settingsError || !settings?.value) {
      return NextResponse.json({
        success: false,
        error: "Webhook URL not configured",
        details: "Please configure your Zapier webhook URL in admin settings",
      })
    }

    const webhookUrl = settings.value

    // Test payload
    const testPayload = {
      event_type: "endpoint_test",
      timestamp: new Date().toISOString(),
      test: true,
      message: "This is a test webhook from The Plate Yard",
      order: {
        order_number: "TEST-" + Date.now(),
        customer_email: "test@example.com",
        total_amount: 100.0,
        status: "test",
      },
    }

    // Send test webhook
    const startTime = Date.now()
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Carolina-Bumper-Plates-Webhook/1.0",
      },
      body: JSON.stringify(testPayload),
    })

    const responseTime = Date.now() - startTime
    const responseText = await response.text()

    // Log the test attempt
    await supabaseAdmin.from("webhook_logs").insert({
      order_id: null, // Test webhook
      webhook_url: webhookUrl,
      payload: testPayload,
      response_status: response.status,
      response_body: responseText,
      response_time_ms: responseTime,
      success: response.ok,
      error_message: response.ok ? null : `HTTP ${response.status}: ${responseText}`,
      retry_count: 0,
    })

    return NextResponse.json({
      success: response.ok,
      webhookUrl,
      response: {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        responseTime,
      },
      payload: testPayload,
      message: response.ok
        ? "Webhook endpoint is responding correctly"
        : `Webhook endpoint returned error: ${response.status} ${response.statusText}`,
    })
  } catch (error) {
    console.error("Error testing webhook endpoint:", error)

    // Log the failed test attempt
    try {
      const { data: settings } = await supabaseAdmin
        .from("admin_settings")
        .select("value")
        .eq("key", "zapier_webhook_url")
        .single()

      if (settings?.value) {
        await supabaseAdmin.from("webhook_logs").insert({
          order_id: null,
          webhook_url: settings.value,
          payload: { event_type: "endpoint_test", test: true },
          response_status: 0,
          response_body: null,
          response_time_ms: 0,
          success: false,
          error_message: error instanceof Error ? error.message : "Network error",
          retry_count: 0,
        })
      }
    } catch (logError) {
      console.error("Error logging failed test:", logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to test webhook endpoint",
        details: error instanceof Error ? error.message : "Network error",
        message: "Unable to reach webhook endpoint - check URL and network connectivity",
      },
      { status: 500 },
    )
  }
}
