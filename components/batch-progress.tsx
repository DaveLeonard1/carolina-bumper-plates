"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Loader2 } from "lucide-react"
import React from "react"

interface BatchProgressProps {
  fullWidth?: boolean // For homepage use max-w-7xl, for other pages use max-w-4xl lg:max-w-6xl
}

interface BatchProgressData {
  currentWeight: number
  goalWeight: number
  percentage: number
  remaining: number
  orderCount: number
  isGoalMet: boolean
}

const BatchProgressComponent = ({ fullWidth = false }: BatchProgressProps) => {
  const [data, setData] = useState<BatchProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchBatchProgress = useCallback(async () => {
    // Prevent duplicate requests
    if (isRefreshing) return
    
    setIsRefreshing(true)
    
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()
    try {
      const response = await fetch("/api/batch-progress", {
        signal: abortControllerRef.current.signal
      })
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Failed to fetch batch progress:", error)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Visibility-based polling setup
  useEffect(() => {
    const startPolling = () => {
      fetchBatchProgress()
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(fetchBatchProgress, 2 * 60 * 1000) // 2 minutes
    }

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        startPolling()
      }
    }

    // Initial load and polling setup
    startPolling()
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchBatchProgress])

  // Memoized calculations for performance
  const progressBarStyle = useMemo(() => ({
    backgroundColor: "#B9FF16",
    width: `${data?.percentage || 0}%`,
  }), [data?.percentage])

  const statusMessage = useMemo(() => {
    if (!data) return null
    
    if (data.isGoalMet) {
      return (
        <div className="flex items-center justify-center gap-2 md:gap-3">
          <span className="text-3xl md:text-4xl">🎉</span>
          <p className="text-xl md:text-2xl font-black text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
            GOAL REACHED! READY FOR BATCH!
          </p>
        </div>
      )
    }
    
    return (
      <div className="flex items-center justify-center gap-2 md:gap-3">
        <span className="text-3xl md:text-4xl">⚠️</span>
        <p className="text-xl md:text-2xl font-black text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
          ONLY <span style={{ color: "#B9FF16" }}>{data.remaining.toLocaleString()} LBS</span> TO GO!
        </p>
      </div>
    )
  }, [data?.isGoalMet, data?.remaining])

  if (loading) {
    return (
      <section className="bg-gray-50">
        <div className="px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 md:mb-8 text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
              BATCH PROGRESS
            </h2>
            <div className="bg-white border-2 border-black rounded-lg p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="bg-gray-50">
      <div className="px-4 pt-8 pb-12 md:py-12">
        <div className={`${fullWidth ? 'max-w-7xl' : 'max-w-4xl'} mx-auto`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 md:mb-8 text-gray-900 text-center" style={{ fontFamily: "Oswald, sans-serif" }}>
            BATCH PROGRESS
          </h2>
          
          <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
            {/* Card Header */}
            <div className="bg-black text-white p-4 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs md:text-sm text-gray-400 mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>CURRENT WEIGHT</div>
                  <div className="text-2xl md:text-5xl font-black" style={{ fontFamily: "Oswald, sans-serif", color: "#B9FF16" }}>
                    {data.currentWeight.toLocaleString()} LBS
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs md:text-sm text-gray-400 mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>GOAL WEIGHT</div>
                  <div className="text-2xl md:text-5xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    {data.goalWeight.toLocaleString()} LBS
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 md:p-6">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-6 md:h-8 mb-4 overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={progressBarStyle}
                />
              </div>

              {/* Status Message */}
              <div className="text-center">
                {statusMessage}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Export memoized component for performance optimization
export const BatchProgress = React.memo(BatchProgressComponent)
