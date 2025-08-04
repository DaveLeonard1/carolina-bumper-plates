"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, Trash2, RefreshCw, AlertTriangle } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { clearAllAuthData, forceSignOut } from "@/lib/auth/clear-auth"

export default function ClearCachePage() {
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState("")

  const handleClearCache = async () => {
    setIsClearing(true)
    setMessage("")

    try {
      const success = await clearAllAuthData()
      if (success) {
        setMessage("✅ All cached data cleared successfully!")
      } else {
        setMessage("❌ Some data may not have been cleared")
      }
    } catch (error) {
      setMessage("❌ Error clearing cache")
    } finally {
      setIsClearing(false)
    }
  }

  const handleForceSignOut = async () => {
    setIsClearing(true)
    await forceSignOut()
    // Page will reload, so no need to set loading to false
  }

  const handleHardRefresh = () => {
    // Clear everything and hard refresh
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = window.location.href
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
      {/* Header */}
      <header
        className="border-b px-4 py-4"
        style={{ backgroundColor: colorUsage.backgroundPrimary, borderColor: colorUsage.border }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8" style={{ color: colorUsage.textPrimary }} />
            <span className="text-xl font-bold">CAROLINA BUMPER PLATES</span>
          </div>
          <Link href="/">
            <Button variant="outline" className="font-semibold">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Trash2 className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textOnLight }} />
            <h1 className="text-4xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              CLEAR CACHE & DATA
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              Clear all cached authentication data and user sessions
            </p>
          </div>

          <div className="space-y-6">
            {/* Warning */}
            <Card className="p-4 border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">
                    <strong>Warning:</strong> This will clear all cached user data and sign out any logged-in users.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Clear Cache Button */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Clear Authentication Cache</h3>
                <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                  Clears all stored authentication tokens, user sessions, and cached data without reloading the page.
                </p>
                <Button
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="w-full font-semibold"
                  style={{
                    backgroundColor: colorUsage.buttonSecondary,
                    color: colorUsage.textOnDark,
                  }}
                >
                  {isClearing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Clearing Cache...
                    </div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cache
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Force Sign Out Button */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Force Sign Out & Reload</h3>
                <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                  Signs out all users, clears all data, and reloads the page to reset everything.
                </p>
                <Button
                  onClick={handleForceSignOut}
                  disabled={isClearing}
                  variant="outline"
                  className="w-full font-semibold"
                  style={{
                    borderColor: "#dc2626",
                    color: "#dc2626",
                  }}
                >
                  {isClearing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      Signing Out...
                    </div>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Sign Out & Reload
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Hard Refresh Button */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Nuclear Option: Hard Refresh</h3>
                <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                  Clears absolutely everything and forces a complete page reload. Use this if other methods don't work.
                </p>
                <Button
                  onClick={handleHardRefresh}
                  variant="outline"
                  className="w-full font-semibold"
                  style={{
                    borderColor: "#7c2d12",
                    color: "#7c2d12",
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Hard Refresh Everything
                </Button>
              </CardContent>
            </Card>

            {/* Clear Email Check Cache */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Clear Email Check Cache</h3>
                <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                  Specifically clears cached email validation results that might be stored locally.
                </p>
                <Button
                  onClick={() => {
                    // Clear specific email-related cache
                    const keys = Object.keys(localStorage)
                    keys.forEach((key) => {
                      if (
                        key.includes("email") ||
                        key.includes("user") ||
                        key.includes("auth") ||
                        key.includes("check")
                      ) {
                        localStorage.removeItem(key)
                      }
                    })

                    // Clear session storage too
                    const sessionKeys = Object.keys(sessionStorage)
                    sessionKeys.forEach((key) => {
                      if (
                        key.includes("email") ||
                        key.includes("user") ||
                        key.includes("auth") ||
                        key.includes("check")
                      ) {
                        sessionStorage.removeItem(key)
                      }
                    })

                    setMessage("✅ Email check cache cleared! Try the email again.")
                  }}
                  className="w-full font-semibold"
                  style={{
                    backgroundColor: "#059669",
                    color: "white",
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Email Check Cache
                </Button>
              </CardContent>
            </Card>

            {/* Status Message */}
            {message && (
              <Card className="p-4 rounded-lg border">
                <CardContent className="pt-4">
                  <p className="text-center font-semibold">{message}</p>
                </CardContent>
              </Card>
            )}

            {/* Manual Instructions */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">Manual Cache Clearing</h3>
                <div className="space-y-3 text-sm" style={{ color: colorUsage.textMuted }}>
                  <p>If the buttons above don't work, you can manually clear cache:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Open browser Developer Tools (F12)</li>
                    <li>Go to Application/Storage tab</li>
                    <li>Clear Local Storage, Session Storage, and Cookies</li>
                    <li>Or use Ctrl+Shift+R (hard refresh)</li>
                    <li>Or open an incognito/private window</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
