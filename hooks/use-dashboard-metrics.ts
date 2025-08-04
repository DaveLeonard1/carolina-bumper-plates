"use client"

import { useState, useEffect, useCallback } from "react"

interface DashboardMetrics {
  totalOrders: number
  totalCustomers: number
  pendingOrders: number
  paidOrders: number
  totalRevenue: number
  recentOrders: number
  recentCustomers: number
}

interface ChartData {
  dailyRevenue: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

interface ActivityItem {
  id: string
  type: "order" | "customer"
  title: string
  description: string
  timestamp: string
  status: string
}

interface DashboardData {
  metrics: DashboardMetrics
  charts: ChartData
  recentActivity: ActivityItem[]
  lastUpdated: string
  debug?: {
    ordersCount: number
    paidOrdersCount: number
    sampleOrder: any
  }
}

export function useDashboardMetrics(refreshInterval = 30000) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      console.log("🔄 Fetching dashboard metrics from hook...")
      const response = await fetch("/api/admin/dashboard-metrics", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("📊 Dashboard hook received:", result)

      if (result.success) {
        setData(result)
        setError(null)
        console.log("✅ Dashboard data updated:", result.metrics)
      } else {
        throw new Error(result.error || "Failed to fetch metrics")
      }
    } catch (err) {
      console.error("❌ Dashboard hook error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered")
    setLoading(true)
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    console.log("🚀 Dashboard hook initializing...")
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    if (refreshInterval > 0) {
      console.log(`⏰ Setting up auto-refresh every ${refreshInterval}ms`)
      const interval = setInterval(() => {
        console.log("⏰ Auto-refresh triggered")
        fetchMetrics()
      }, refreshInterval)

      return () => {
        console.log("🛑 Clearing auto-refresh interval")
        clearInterval(interval)
      }
    }
  }, [fetchMetrics, refreshInterval])

  return {
    data,
    loading,
    error,
    refresh,
  }
}
