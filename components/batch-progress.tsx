"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface BatchProgressData {
  currentWeight: number
  goalWeight: number
  percentage: number
  remaining: number
  orderCount: number
  isGoalMet: boolean
}

export function BatchProgress() {
  const [data, setData] = useState<BatchProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBatchProgress()
    // Refresh every 60 seconds
    const interval = setInterval(fetchBatchProgress, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchBatchProgress = async () => {
    try {
      const response = await fetch("/api/batch-progress")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch batch progress:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-white">
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
    <section className="bg-white">
      <div className="px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
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
                  style={{
                    backgroundColor: "#B9FF16",
                    width: `${data.percentage}%`,
                  }}
                />
              </div>

              {/* Status Message */}
              <div className="text-center">
                {data.isGoalMet ? (
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <span className="text-3xl md:text-4xl">🎉</span>
                    <p className="text-xl md:text-2xl font-black text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
                      GOAL REACHED! READY FOR BATCH!
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <span className="text-3xl md:text-4xl">⚠️</span>
                    <p className="text-xl md:text-2xl font-black text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
                      ONLY <span style={{ color: "#B9FF16" }}>{data.remaining.toLocaleString()} LBS</span> TO GO!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
