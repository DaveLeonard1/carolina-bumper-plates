"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, Search, Trash2, AlertTriangle, RefreshCw } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"

interface User {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
}

interface DebugData {
  users: User[]
  userCount: number
  orders: any[]
  orderCount: number
  profiles: any[]
  profileCount: number
}

export default function DebugAuthPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState("")

  const fetchDebugData = async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/debug-users")
      const result = await response.json()

      if (result.success) {
        setDebugData(result)
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage("❌ Failed to fetch debug data")
    } finally {
      setLoading(false)
    }
  }

  const deleteAllUsers = async () => {
    if (!confirm("Are you sure you want to delete ALL users and data? This cannot be undone!")) {
      return
    }

    setDeleting(true)
    setMessage("")

    try {
      const response = await fetch("/api/delete-all-users", {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        setMessage(`✅ Deleted ${result.deletedUsers.length} users successfully`)
        if (result.errors.length > 0) {
          setMessage((prev) => prev + `\n⚠️ ${result.errors.length} errors occurred`)
        }
        // Refresh the data
        await fetchDebugData()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage("❌ Failed to delete users")
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Search className="h-16 w-16 mx-auto mb-4" style={{ color: colorUsage.textOnLight }} />
            <h1 className="text-4xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              DEBUG AUTHENTICATION
            </h1>
            <p className="text-xl mb-4" style={{ color: colorUsage.textMuted }}>
              Check what users and data actually exist in Supabase
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-yellow-800 text-sm">
                <strong>Issue:</strong> Email check is detecting leonardd623@gmail.com as existing user.
                <br />
                <strong>Solution:</strong> Use the "Delete All Users & Data" button below to clear the auth system.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Controls */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    onClick={fetchDebugData}
                    disabled={loading}
                    className="font-semibold"
                    style={{
                      backgroundColor: colorUsage.buttonSecondary,
                      color: colorUsage.textOnDark,
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={deleteAllUsers}
                    disabled={deleting || !debugData}
                    variant="outline"
                    className="font-semibold"
                    style={{
                      borderColor: "#dc2626",
                      color: "#dc2626",
                    }}
                  >
                    {deleting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        Deleting...
                      </div>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Users & Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Message */}
            {message && (
              <Card className="p-4 rounded-lg border">
                <CardContent className="pt-4">
                  <pre className="text-sm whitespace-pre-wrap">{message}</pre>
                </CardContent>
              </Card>
            )}

            {/* Debug Data */}
            {debugData && (
              <>
                {/* Summary */}
                <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-4">Database Summary</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: colorUsage.textOnLight }}>
                          {debugData.userCount}
                        </p>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Auth Users
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: colorUsage.textOnLight }}>
                          {debugData.orderCount}
                        </p>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Orders
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: colorUsage.textOnLight }}>
                          {debugData.profileCount}
                        </p>
                        <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                          Profiles
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Users List */}
                {debugData.userCount > 0 && (
                  <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-4">Auth Users Found</h3>
                      <div className="space-y-3">
                        {debugData.users.map((user) => (
                          <div key={user.id} className="border rounded p-3" style={{ borderColor: colorUsage.border }}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{user.email}</p>
                                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                                  ID: {user.id}
                                </p>
                                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                                  Created: {new Date(user.created_at).toLocaleString()}
                                </p>
                                {user.email_confirmed_at && (
                                  <p className="text-sm text-green-600">
                                    ✅ Email confirmed: {new Date(user.email_confirmed_at).toLocaleString()}
                                  </p>
                                )}
                                {user.last_sign_in_at && (
                                  <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                                    Last sign in: {new Date(user.last_sign_in_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {debugData.userCount === 0 && debugData.orderCount === 0 && debugData.profileCount === 0 && (
                  <Card className="p-6 rounded-lg border bg-green-50">
                    <CardContent className="pt-6 text-center">
                      <div className="text-green-800">
                        <h3 className="text-xl font-bold mb-2">✅ All Clean!</h3>
                        <p>No users, orders, or profiles found in the database.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Instructions */}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">What This Shows</h3>
                <div className="space-y-2 text-sm" style={{ color: colorUsage.textMuted }}>
                  <p>
                    • <strong>Auth Users:</strong> Users in Supabase's auth.users table
                  </p>
                  <p>
                    • <strong>Orders:</strong> Records in the orders table
                  </p>
                  <p>
                    • <strong>Profiles:</strong> Records in the customer_profiles table
                  </p>
                  <p className="mt-4 text-orange-600">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    If you see users here but deleted them in the Supabase dashboard, they might still exist in the auth
                    system.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
