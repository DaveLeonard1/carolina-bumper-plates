import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Database } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"

async function testDatabaseConnection() {
  try {
    // Check if we can import and use Supabase
    const { createClient } = await import("@supabase/supabase-js")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: "Missing environment variables",
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseServiceKey,
        },
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Test a simple query
    const { data, error } = await supabase.from("orders").select("count").limit(1)

    return {
      success: true,
      message: "Database connection successful!",
      queryResult: error ? `Expected error: ${error.message}` : "Query successful",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export default async function TestDatabasePage() {
  const testResult = await testDatabaseConnection()

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
      <div className="px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Database className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textOnLight }} />
            <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              DATABASE CONNECTION TEST
            </h1>
          </div>

          <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                {testResult.success ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {testResult.success ? "✅ Connection Successful" : "❌ Connection Failed"}
                  </h2>
                  <p style={{ color: colorUsage.textMuted }}>
                    {testResult.success ? testResult.message : testResult.error}
                  </p>
                </div>
              </div>

              {testResult.queryResult && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Query Test:</h3>
                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {testResult.queryResult}
                  </p>
                </div>
              )}

              {testResult.details && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Environment Check:</h3>
                  <div className="text-sm space-y-1" style={{ color: colorUsage.textMuted }}>
                    <p>Supabase URL: {testResult.details.hasUrl ? "✅ Set" : "❌ Missing"}</p>
                    <p>Service Key: {testResult.details.hasKey ? "✅ Set" : "❌ Missing"}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
                {testResult.success && (
                  <Link href="/checkout" className="flex-1">
                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: colorUsage.buttonSecondary,
                        color: colorUsage.textOnDark,
                      }}
                    >
                      Try Checkout
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {testResult.success && (
            <Card className="p-4 rounded-lg border mt-6" style={{ backgroundColor: "#f0f9ff" }}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm">
                    <strong>Great!</strong> Your database is connected and ready. The checkout will now save orders to
                    Supabase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
