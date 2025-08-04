import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { webhook_url } = await request.json()

    if (!webhook_url) {
      return NextResponse.json({ success: false, error: "Webhook URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(webhook_url)
    } catch {
      return NextResponse.json({ success: false, error: "Invalid webhook URL format" }, { status: 400 })
    }

    // Test with a simple ping payload
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Webhook endpoint connectivity test",
      source: "carolina-bumper-plates-debug",
    }

    const startTime = Date.now()

    try {
      const response = await fetch(webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Carolina-Bumper-Plates-Debug/1.0",
          "X-Test-Request": "true",
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseTime = Date.now() - startTime
      let responseBody = ""

      try {
        responseBody = await response.text()
      } catch (bodyError) {
        responseBody = "Could not read response body"
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response_time_ms: responseTime,
        response_body: responseBody.substring(0, 1000), // Limit response size
        response_headers: Object.fromEntries(response.headers.entries()),
        message: response.ok
          ? "Webhook endpoint is reachable and responding"
          : `Webhook endpoint returned error status ${response.status}`,
      })
    } catch (error) {
      const responseTime = Date.now() - startTime

      return NextResponse.json({
        success: false,
        status: 0,
        response_time_ms: responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to reach webhook endpoint",
        details: {
          name: error instanceof Error ? error.name : "UnknownError",
          cause: error instanceof Error ? error.cause : null,
        },
      })
    }
  } catch (error) {
    console.error("Error testing webhook endpoint:", error)
    return NextResponse.json({ success: false, error: "Failed to test webhook endpoint" }, { status: 500 })
  }
}
