"use client"

import { useState, useEffect } from "react"

interface SystemHealthMetrics {
  status: "healthy" | "warning" | "error"
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
  }
  issues: string[]
  checks: {
    databaseConnectivity: boolean
    orderSystemHealth: boolean
    customerSystemHealth: boolean
    performanceAcceptable: boolean
  }
}

export function useSystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const runHealthCheck = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/system-health-check")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Health check failed")
      }

      setHealthData(data)
      setLastChecked(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      console.error("Health check error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (!isLoading) {
          runHealthCheck()
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [isLoading])

  return {
    healthData,
    isLoading,
    error,
    lastChecked,
    runHealthCheck,
  }
}
