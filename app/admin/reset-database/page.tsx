"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetDatabasePage() {
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleReset = async () => {
    if (!confirm("Are you sure you want to delete ALL users, orders, and customers? This cannot be undone!")) {
      return
    }

    const secondConfirm = confirm(
      "This will permanently delete:\n• All customer accounts\n• All orders\n• All user authentication data\n• All webhook logs and queue entries\n\nClick OK to continue to final confirmation.",
    )
    if (!secondConfirm) {
      return
    }

    const finalConfirm = prompt("Type 'DELETE' to confirm database reset:")
    if (finalConfirm !== "DELETE") {
      alert("Reset cancelled - you must type 'DELETE' exactly")
      return
    }

    setIsResetting(true)
    setResult(null)

    try {
      console.log("🗑️ Starting database reset...")
      const response = await fetch("/api/delete-all-users", {
        method: "DELETE",
      })

      const data = await response.json()
      console.log("Reset response:", data)
      setResult(data)
    } catch (error) {
      console.error("Reset error:", error)
      setResult({
        success: false,
        error: "Failed to reset database - network or server error",
        deletedUsers: [],
        ordersCleared: false,
        customersCleared: false,
        webhookLogsCleared: false,
        webhookQueueCleared: false,
        ordersCount: 0,
        customersCount: 0,
        webhookLogsCount: 0,
        webhookQueueCount: 0,
        errors: [{ table: "network", error: "Failed to communicate with server" }],
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">⚠️ Reset Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Warning: Destructive Action</h3>
              <p className="text-red-700 text-sm">This will permanently delete:</p>
              <ul className="list-disc list-inside text-red-700 text-sm mt-2 space-y-1">
                <li>All customer accounts (customers table)</li>
                <li>All orders (orders table)</li>
                <li>All user authentication data (auth.users)</li>
                <li>All webhook logs and queue entries</li>
                <li>Products table will remain intact</li>
              </ul>
              <p className="text-red-700 text-sm mt-2 font-medium">This action cannot be undone!</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Reset Process</h3>
              <p className="text-blue-700 text-sm">The system will:</p>
              <ol className="list-decimal list-inside text-blue-700 text-sm mt-2 space-y-1">
                <li>Count existing records</li>
                <li>Delete all webhook logs (to avoid foreign key conflicts)</li>
                <li>Delete all webhook queue entries</li>
                <li>Delete all orders</li>
                <li>Delete all customers</li>
                <li>Delete all authentication users</li>
                <li>Verify deletion was successful</li>
              </ol>
            </div>

            <Button onClick={handleReset} disabled={isResetting} variant="destructive" className="w-full">
              {isResetting ? "Resetting Database..." : "Reset Database"}
            </Button>

            {result && (
              <div
                className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <h3 className={`font-semibold mb-2 ${result.success ? "text-green-800" : "text-red-800"}`}>
                  {result.success ? "Reset Completed Successfully" : "Reset Completed with Issues"}
                </h3>

                <div className={`text-sm space-y-1 ${result.success ? "text-green-700" : "text-red-700"}`}>
                  <p>
                    🗂️ Webhook logs deleted: {result.webhookLogsCount || 0} {result.webhookLogsCleared ? "✅" : "❌"}
                  </p>
                  <p>
                    📋 Webhook queue deleted: {result.webhookQueueCount || 0} {result.webhookQueueCleared ? "✅" : "❌"}
                  </p>
                  <p>
                    📊 Orders deleted: {result.ordersCount || 0} {result.ordersCleared ? "✅" : "❌"}
                  </p>
                  <p>
                    👥 Customers deleted: {result.customersCount || 0} {result.customersCleared ? "✅" : "❌"}
                  </p>
                  <p>🔐 Auth users deleted: {result.deletedUsers?.length || 0}</p>

                  {result.deletedUsers?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Deleted user accounts:</p>
                      {result.deletedUsers.slice(0, 5).map((user: any, index: number) => (
                        <p key={index} className="text-xs ml-2">
                          • {user.email}
                        </p>
                      ))}
                      {result.deletedUsers.length > 5 && (
                        <p className="text-xs ml-2">... and {result.deletedUsers.length - 5} more</p>
                      )}
                    </div>
                  )}

                  {result.errors?.length > 0 && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                      <p className="font-medium text-orange-800">Issues encountered:</p>
                      {result.errors.map((error: any, index: number) => (
                        <p key={index} className="text-xs text-orange-700 mt-1">
                          {error.table}: {error.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <details className="mt-3">
                  <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                    Show technical details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => (window.location.href = "/admin")} className="flex-1">
                Back to Admin
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
