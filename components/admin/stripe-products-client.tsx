"use client"

import type React from "react"

/*  This is 100 % of the old page’s code, moved into its own client component.
    Nothing else has been changed – hooks, state, fetch-logic and rendering
    stay exactly the same.  */

import { useState, useEffect } from "react"
import { RefreshCw, Loader2, Zap, CheckCircle, XCircle, Package, DollarSign } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ProductSyncStatus {
  id: string
  title: string
  weight: number
  selling_price: number
  regular_price: number
  stripe_synced: boolean
  stripe_product_id?: string
  stripe_price_id?: string
  last_synced?: string
  active: boolean
  has_image: boolean
}

interface SyncResponse {
  success: boolean
  products: ProductSyncStatus[]
  total_products: number
  synced_products: number
  unsynced_products: number
  database_ready: boolean
  stripe_configured: boolean
  issues: string[]
  error?: string
}

export default function StripeProductsClient() {
  const [products, setProducts] = useState<ProductSyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [stats, setStats] = useState({ total: 0, synced: 0, unsynced: 0 })
  const [issues, setIssues] = useState<string[]>([])
  const { toast } = useToast()

  const fetchProductStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/sync-stripe-products")
      const data: SyncResponse = await res.json()

      if (data.success) {
        setProducts(data.products)
        setStats({
          total: data.total_products,
          synced: data.synced_products,
          unsynced: data.unsynced_products,
        })
        setIssues(data.issues || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch product status",
          variant: "destructive",
        })
        setIssues(data.issues || [])
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to fetch product status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const syncProducts = async () => {
    try {
      setSyncing(true)
      const res = await fetch("/api/admin/sync-stripe-products", { method: "POST" })
      const data = await res.json()

      if (data.success) {
        toast({ title: "Success", description: data.message })
        await fetchProductStatus()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sync products",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to sync products",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchProductStatus()
  }, [])

  /* ---------- helpers ---------- */
  const formatDate = (d?: string) =>
    !d
      ? "Never"
      : new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })

  const formatPrice = (p: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(p)

  const savings = (s: number, r: number) => {
    const diff = r - s
    return { amount: diff, pct: Math.round((diff / r) * 100) }
  }

  /* ---------- render ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (issues.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-orange-600" />
            Setup Required
          </CardTitle>
          <CardDescription>Resolve the following issues before syncing products with Stripe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside text-sm space-y-1 text-orange-700">
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
          <Button variant="outline" onClick={fetchProductStatus}>
            <RefreshCw className="h-4 w-4 mr-2" /> Check Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stripe Product Management</h1>
          <p className="text-muted-foreground">Sync products with Stripe using selling_price as the flat price</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProductStatus} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={syncProducts} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Sync All Products
          </Button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total" icon={Package} value={stats.total} />
        <StatCard title="Synced" icon={CheckCircle} value={stats.synced} iconClass="text-green-600" />
        <StatCard title="Unsynced" icon={XCircle} value={stats.unsynced} iconClass="text-orange-600" />
      </div>

      {/* products list */}
      <Card>
        <CardHeader>
          <CardTitle>Product Sync Status</CardTitle>
          <CardDescription>Selling price is used as the flat price in Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {products.map((p) => {
                const sv = savings(p.selling_price, p.regular_price)
                return (
                  <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {p.stripe_synced ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-600" />
                      )}
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {p.weight}lb • {formatPrice(p.selling_price)} (
                          <span className="line-through">{formatPrice(p.regular_price)}</span>
                          &nbsp;-{sv.pct}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={p.stripe_synced ? "default" : "secondary"}>
                        {p.stripe_synced ? "Synced" : "Not Synced"}
                      </Badge>

                      {p.stripe_synced && (
                        <div className="hidden sm:block text-xs max-w-[200px] text-muted-foreground">
                          <div>Product: {p.stripe_product_id?.slice(0, 16)}…</div>
                          <div>Price:&nbsp;&nbsp;{p.stripe_price_id?.slice(0, 16)}…</div>
                        </div>
                      )}

                      {p.has_image && <Package className="h-4 w-4 text-green-600" />}
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------- tiny helpers so the main render stays readable ---------- */
function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  iconClass?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${iconClass || ""}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No products found</p>
      <p className="text-sm">Add products in the Products page</p>
    </div>
  )
}
