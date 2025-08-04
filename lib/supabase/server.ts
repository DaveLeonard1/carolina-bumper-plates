import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables:", {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
  })
}

export const supabaseServer = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null
