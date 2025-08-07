import { getEnvOrOption } from '@/lib/options'

export interface StripeConfig {
  mode: "sandbox" | "live"
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

interface StripeConfigCache {
  [mode: string]: {
    config: StripeConfig;
    expiresAt: number;
  }
}

// Cache configurations by mode
let configCache: StripeConfigCache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Utility function to require environment variables or throw clear errors
 */
function requireEnv(value: string | null | undefined, name: string, mode: string): string {
  if (!value) {
    throw new Error(`Stripe ${name} not configured for ${mode} mode. Check environment variables or options table.`)
  }
  return value
}

/**
 * Get Stripe configuration for a specific mode
 * Falls back to the options table if environment variables aren't set
 */
export async function getStripeConfig(requestedMode?: "live" | "sandbox"): Promise<StripeConfig> {
  // Determine which mode to use
  const mode = requestedMode || await getStripeModeFromDatabase()
  
  // Check cache first
  if (configCache[mode] && Date.now() < configCache[mode].expiresAt) {
    return configCache[mode].config
  }

  // Debug: Log which mode we're using
  console.log(`🔧 Stripe mode: ${mode}`)

  // Get config values with fallback to options table
  const publishableKey = await getEnvOrOption(
    mode === "live" ? "STRIPE_LIVE_PUBLISHABLE_KEY" : "STRIPE_TEST_PUBLISHABLE_KEY",
    mode === "live" ? "stripe_live_publishable_key" : "stripe_test_publishable_key",
    ""
  )

  const secretKey = await getEnvOrOption(
    mode === "live" ? "STRIPE_LIVE_SECRET_KEY" : "STRIPE_TEST_SECRET_KEY",
    mode === "live" ? "stripe_live_secret_key" : "stripe_test_secret_key", 
    ""
  )

  const webhookSecret = await getEnvOrOption(
    mode === "live" ? "STRIPE_LIVE_WEBHOOK_SECRET" : "STRIPE_TEST_WEBHOOK_SECRET",
    mode === "live" ? "stripe_live_webhook_secret" : "stripe_test_webhook_secret",
    ""
  )

  // Create config object with validation
  const config: StripeConfig = {
    mode,
    publishableKey: requireEnv(publishableKey, "publishable key", mode),
    secretKey: requireEnv(secretKey, "secret key", mode),
    webhookSecret: requireEnv(webhookSecret, "webhook secret", mode)
  }
  
  // Debug: Log whether keys are found (without exposing the actual keys)
  console.log(`🔧 Stripe config check:`, {
    mode,
    hasPublishableKey: !!config.publishableKey,
    hasSecretKey: !!config.secretKey,
    hasWebhookSecret: !!config.webhookSecret,
    secretKeyLength: config.secretKey?.length || 0
  })

  // Cache the config
  configCache[mode] = {
    config,
    expiresAt: Date.now() + CACHE_TTL
  }

  return config
}

/**
 * Get Stripe mode from database settings
 */
async function getStripeModeFromDatabase(): Promise<"sandbox" | "live"> {
  try {
    const { createSupabaseAdmin } = await import("@/lib/supabase")
    const supabaseAdmin = createSupabaseAdmin()

    const { data: settings, error } = await supabaseAdmin.from("stripe_settings").select("stripe_mode").single()

    if (error || !settings) {
      console.log("No Stripe mode setting found, defaulting to sandbox")
      return "sandbox"
    }

    return settings.stripe_mode || "sandbox"
  } catch (error) {
    console.error("Error fetching Stripe mode:", error)
    return "sandbox"
  }
}

/**
 * Get Stripe publishable key for client-side use
 */
export async function getStripePublishableKey(mode?: "live" | "sandbox"): Promise<string> {
  const config = await getStripeConfig(mode)
  return config.publishableKey
}

/**
 * Clear the Stripe configuration cache
 */
export function clearStripeConfigCache(mode?: string) {
  if (mode) {
    delete configCache[mode]
  } else {
    configCache = {}
  }
}
