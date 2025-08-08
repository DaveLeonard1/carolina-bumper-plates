"use client"

import { useState, useCallback } from "react"

interface DashboardData {
  status: string
  timestamp: string
  responseTime: number
  metrics: {
    database: {
      status: string
      responseTime: number
    }
    orders: {
      total: number
      paid: number
      pending: number
      recent24h: number
    }
    revenue: {
      total: number
      formatted: string
    }
    customers: {
      total: number
    }
    webhooks: {
      total: number
      successful: number
      failed: number
      pending: number
      processing: number
      failedQueue: number
      recent24h: number
      avgResponseTime: number
      enabled: boolean
      configured: boolean
      successRate: number
    }
  }
  issues: string[]
  checks: {
    databaseConnectivity: boolean
    orderSystemHealth: boolean
    customerSystemHealth: boolean
    webhookSystemHealth: boolean
    webhookConfiguration: boolean
    webhookDeliveryHealth: boolean
    performanceAcceptable: boolean
  }
  webhookDetails: {
    recentLogs: any[]
    queueItems: any[]
    settings: any
  }
}

export function useUnifiedDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/unified-dashboard")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDashboardData(data)
      setLastChecked(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
      setDashboardData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    dashboardData,
    isLoading,
    error,
    lastChecked,
    fetchDashboardData,
  }
}
