import { NextResponse } from 'next/server'
import { setOptions } from '@/lib/options'

export async function POST() {
  try {
    const envMappings = [
      // Stripe
      { env: 'STRIPE_PUBLISHABLE_KEY', option: 'stripe_publishable_key' },
      { env: 'STRIPE_SECRET_KEY', option: 'stripe_secret_key' },
      { env: 'STRIPE_WEBHOOK_SECRET', option: 'stripe_webhook_secret' },
      
      // Mailgun
      { env: 'MAILGUN_API_KEY', option: 'mailgun_api_key' },
      { env: 'MAILGUN_DOMAIN', option: 'mailgun_domain' },
      { env: 'MAILGUN_FROM_EMAIL', option: 'mailgun_from_email' },
      
      // Supabase
      { env: 'NEXT_PUBLIC_SUPABASE_URL', option: 'supabase_url' },
      { env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', option: 'supabase_anon_key' },
      { env: 'SUPABASE_SERVICE_ROLE_KEY', option: 'supabase_service_role_key' },
      
      // Application
      { env: 'NEXT_PUBLIC_BASE_URL', option: 'app_base_url' },
      { env: 'NODE_ENV', option: 'app_environment' },
    ]

    const updates = []
    let syncedCount = 0

    for (const mapping of envMappings) {
      const envValue = process.env[mapping.env]
      if (envValue && envValue.trim() !== '') {
        updates.push({
          option_name: mapping.option,
          option_value: envValue
        })
        syncedCount++
      }
    }

    if (updates.length > 0) {
      const success = await setOptions(updates)
      
      if (!success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to sync environment variables' 
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} environment variables to options table`,
      synced_count: syncedCount,
      total_mappings: envMappings.length
    })
  } catch (error) {
    console.error('Error syncing environment variables:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
