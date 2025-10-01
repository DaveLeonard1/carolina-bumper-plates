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
      <section style={{ backgroundColor: "#1a1a1a" }}>
        <div className="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
          <div className="max-w-[1440px] mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-black mb-12 text-white" style={{ fontFamily: "Oswald, sans-serif" }}>
              BATCH PROGRESS
            </h2>
            <div className="bg-gray-800 rounded-2xl p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
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
    <section style={{ backgroundColor: "#1a1a1a" }}>
      <div className="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
        <div className="max-w-[1440px] mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-12 text-white" style={{ fontFamily: "Oswald, sans-serif" }}>
            BATCH PROGRESS
          </h2>
          <div className="bg-gray-800 rounded-2xl p-8">
            {/* Top Display: Current Weight vs Goal Weight */}
            <div className="flex justify-between items-center mb-6 text-white">
              <div>
                <div className="text-sm text-gray-400 mb-1">CURRENT WEIGHT</div>
                <div className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {data.currentWeight.toLocaleString()} LBS
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">GOAL WEIGHT</div>
                <div className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {data.goalWeight.toLocaleString()} LBS
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
              <div
                className="h-4 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: "#B9FF16",
                  width: `${data.percentage}%`,
                }}
              />
            </div>

            {/* Bottom: Remaining Weight */}
            <div className="flex items-center justify-center gap-2 text-white">
              {data.isGoalMet ? (
                <>
                  <span className="text-2xl">🎉</span>
                  <p className="text-xl md:text-2xl font-black" style={{ color: "#B9FF16", fontFamily: "Oswald, sans-serif" }}>
                    GOAL REACHED! {data.currentWeight.toLocaleString()} LBS READY FOR BATCH!
                  </p>
                </>
              ) : (
                <>
                  <span className="text-2xl">⚠️</span>
                  <p className="text-xl md:text-2xl font-black" style={{ color: "#B9FF16", fontFamily: "Oswald, sans-serif" }}>
                    {data.remaining.toLocaleString()} LBS TO GO!
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
