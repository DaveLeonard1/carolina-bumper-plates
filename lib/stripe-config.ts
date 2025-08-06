export interface StripeConfig {
  mode: "sandbox" | "live"
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

let cachedConfig: StripeConfig | null = null
let cacheExpiry = 0

export async function getStripeConfig(): Promise<StripeConfig> {
  // Cache for 5 minutes to avoid frequent DB calls
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig
  }

  // Get mode from database settings
  const mode = await getStripeModeFromDatabase()
  
  // Debug: Log which mode we're using
  console.log(`🔧 Stripe mode: ${mode}`)

  const config: StripeConfig = {
    mode,
    publishableKey:
      mode === "live"
        ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || ""
        : process.env.STRIPE_TEST_PUBLISHABLE_KEY || "",
    secretKey:
      mode === "live"
        ? process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ""
        : process.env.STRIPE_TEST_SECRET_KEY || "",
    webhookSecret:
      mode === "live"
        ? process.env.STRIPE_LIVE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ""
        : process.env.STRIPE_TEST_WEBHOOK_SECRET || "",
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
  cachedConfig = config
  cacheExpiry = Date.now() + 5 * 60 * 1000 // 5 minutes

  return config
}

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

export function clearStripeConfigCache() {
  cachedConfig = null
  cacheExpiry = 0
}
