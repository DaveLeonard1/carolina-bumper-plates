import formData from 'form-data'
import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(formData)

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
})

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandbox54b1481ac4984524830808512cc09c7f.mailgun.org'
const FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'The Plate Yard <noreply@carolinabumperplates.com>'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    console.log('📧 Sending email via Mailgun:', { to, subject, domain: MAILGUN_DOMAIN })

    const result = await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text: text || stripHtml(html),
    })

    console.log('✅ Email sent successfully:', result)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Simple HTML tag stripper for text fallback
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
