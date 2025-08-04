import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    console.log("Testing payment link creation for order:", orderId)

    // Call the actual payment link creation API
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/create-payment-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      testResult: {
        status: response.status,
        statusText: response.statusText,
        result,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Test payment link creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
