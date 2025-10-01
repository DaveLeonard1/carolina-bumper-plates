import { colorUsage } from '@/lib/colors'

interface PaymentReceiptEmailParams {
  customerName: string
  orderNumber: string
  orderTotal: number
  paidAt: string
  orderItems?: Array<{ weight: number; quantity: number; price: number }>
}

export function generatePaymentReceiptEmail({
  customerName,
  orderNumber,
  orderTotal,
  paidAt,
  orderItems = [],
}: PaymentReceiptEmailParams): { subject: string; html: string } {
  const subject = `Payment Received - Order ${orderNumber} | The Plate Yard`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${colorUsage.backgroundDark}; padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: ${colorUsage.accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: ${colorUsage.textOnAccent}; font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0; color: ${colorUsage.accent}; font-size: 32px; font-weight: bold; font-family: 'Oswald', Arial, sans-serif;">
                PAYMENT RECEIVED!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">
                Thank you, ${customerName}!
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                We've received your payment and your order is confirmed! Your bumper plates will be delivered within 2-3 weeks.
              </p>

              <!-- Payment Confirmed Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #e8f5e9; padding: 20px; border-radius: 4px; border-left: 4px solid #4caf50;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #333; font-size: 16px;">Order ${orderNumber}</td>
                        <td align="right" style="color: #4caf50; font-size: 24px; font-weight: bold;">
                          $${orderTotal.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="color: #666; font-size: 14px; padding-top: 10px;">
                          Paid on ${new Date(paidAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/my-account" style="display: inline-block; background-color: ${colorUsage.accent}; color: ${colorUsage.textOnAccent}; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 18px; font-weight: bold; font-family: 'Oswald', Arial, sans-serif;">
                      VIEW MY ORDERS
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${colorUsage.backgroundDark}; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: ${colorUsage.textOnDark}; font-size: 16px; font-weight: bold;">
                Questions? We're here to help!
              </p>
              <p style="margin: 0; color: #999; font-size: 14px;">
                Email us at <a href="mailto:orders@theplateyard.com" style="color: ${colorUsage.accent}; text-decoration: none;">orders@theplateyard.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, html }
}
