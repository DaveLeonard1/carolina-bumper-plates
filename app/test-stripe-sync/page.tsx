"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductStatus {
  id: number
  weight: number
  title: string
  selling_price: number
  has_stripe_product: boolean
  has_stripe_price: boolean
  is_active: boolean
  last_synced: string | null
  ready_for_invoicing: boolean
}

interface SyncStatus {
  total_products: number
  synced_products: number
  products_with_prices: number
  active_products: number
  products: ProductStatus[]
}

export default function TestStripeSyncPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchSyncStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test-stripe-sync")
      const data = await response.json()

      if (data.success) {
        setSyncStatus(data.sync_status)
      } else {
        console.error("Failed to fetch sync status:", data.error)
      }
    } catch (error) {
      console.error("Error fetching sync status:", error)
    } finally {
      setLoading(false)
    }
  }

  const runSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch("/api/test-stripe-sync", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert("Sync completed successfully!")
        await fetchSyncStatus() // Refresh status
      } else {
        alert(`Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Error running sync:", error)
      alert("Sync failed with error")
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchSyncStatus()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Stripe Product Sync Status</h1>
        <p>Loading sync status...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Stripe Product Sync Status</h1>

      {syncStatus && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncStatus.total_products}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Synced Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{syncStatus.synced_products}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">With Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{syncStatus.products_with_prices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{syncStatus.active_products}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={fetchSyncStatus} disabled={loading}>
              Refresh Status
            </Button>
            <Button onClick={runSync} disabled={syncing} variant="outline">
              {syncing ? "Syncing..." : "Run Sync"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncStatus.products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">
                          {product.weight}lb - {product.title}
                        </h3>
                        <p className="text-sm text-gray-600">${product.selling_price}</p>
                      </div>
                      <div className="flex gap-2">
                        {product.ready_for_invoicing ? (
                          <Badge variant="default" className="bg-green-500">
                            Ready for Invoicing
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Needs Setup</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Stripe Product: </span>
                        {product.has_stripe_product ? (
                          <span className="text-green-600">✅ Yes</span>
                        ) : (
                          <span className="text-red-600">❌ No</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Stripe Price: </span>
                        {product.has_stripe_price ? (
                          <span className="text-green-600">✅ Yes</span>
                        ) : (
                          <span className="text-red-600">❌ No</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Active: </span>
                        {product.is_active ? (
                          <span className="text-green-600">✅ Yes</span>
                        ) : (
                          <span className="text-red-600">❌ No</span>
                        )}
                      </div>
                    </div>

                    {product.last_synced && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last synced: {new Date(product.last_synced).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
