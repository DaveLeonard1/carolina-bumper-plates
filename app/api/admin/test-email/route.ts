import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/mailgun"

export async function POST(request: Request) {
  try {
    const { to } = await request.json()

    if (!to) {
      return NextResponse.json({ success: false, error: "Email address is required" }, { status: 400 })
    }

    console.log(`🧪 Testing email send to: ${to}`)

    const result = await sendEmail({
      to,
      subject: "Test Email from The Plate Yard",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email</h2>
          <p>This is a test email from The Plate Yard admin panel.</p>
          <p>If you received this, Mailgun is configured correctly!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
    })

    console.log(`📬 Test email result:`, result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId,
        recipient: to,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: "Check server logs for more information",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
