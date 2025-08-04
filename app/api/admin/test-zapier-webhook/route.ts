import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { webhook_url, event_type = "payment_link_created" } = await request.json()

    if (!webhook_url) {
      return NextResponse.json({ success: false, error: "Webhook URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(webhook_url)
    } catch {
      return NextResponse.json({ success: false, error: "Invalid webhook URL format" }, { status: 400 })
    }

    // Create test payload based on event type
    let testPayload: any

    if (event_type === "payment_link_created") {
      testPayload = {
        event_type: "payment_link_created",
        timestamp: new Date().toISOString(),
        order: {
          id: "test-order-id",
          order_number: "CBP-TEST-001",
          status: "pending",
          payment_link_url: "https://checkout.stripe.com/test",
          total_amount: 299.99,
          currency: "USD",
          created_at: new Date().toISOString(),
          items: [
            {
              weight: 45,
              quantity: 2,
              price: 149.99,
              total: 299.98,
              product_title: "45lb Bumper Plate",
            },
          ],
        },
        customer: {
          email: "test@example.com",
          first_name: "Test",
          last_name: "Customer",
          full_name: "Test Customer",
          phone: "+1234567890",
        },
        metadata: {
          source: "test",
          created_via: "webhook_test",
        },
      }
    } else if (event_type === "order_completed") {
      testPayload = {
        event_type: "order_completed",
        timestamp: new Date().toISOString(),
        order: {
          id: "test-order-id",
          order_number: "CBP-TEST-001",
          status: "paid",
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          total_amount: 299.99,
          currency: "USD",
          created_at: new Date().toISOString(),
          items: [
            {
              weight: 45,
              quantity: 2,
              price: 149.99,
              total: 299.98,
              product_title: "45lb Bumper Plate",
            },
          ],
        },
        customer: {
          email: "test@example.com",
          first_name: "Test",
          last_name: "Customer",
          full_name: "Test Customer",
          phone: "+1234567890",
        },
        payment: {
          method: "stripe_checkout",
          amount_paid: 299.99,
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: "pi_test123",
        },
        metadata: {
          source: "test",
          trigger: "webhook_test",
        },
      }
    }

    // Send test webhook
    const startTime = Date.now()

    try {
      const response = await fetch(webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Carolina-Bumper-Plates-Webhook/1.0",
          "X-Test-Webhook": "true",
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseTime = Date.now() - startTime
      const responseBody = await response.text()

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        response_time_ms: responseTime,
        response_body: responseBody.substring(0, 500), // Limit response size
        message: response.ok ? "Test webhook sent successfully" : `Test webhook failed with status ${response.status}`,
        event_type,
      })
    } catch (error) {
      const responseTime = Date.now() - startTime

      return NextResponse.json({
        success: false,
        status: 0,
        response_time_ms: responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Test webhook failed to send",
        event_type,
      })
    }
  } catch (error) {
    console.error("Error testing webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to test webhook" }, { status: 500 })
  }
}
