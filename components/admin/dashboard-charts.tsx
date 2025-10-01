"use client"

interface ChartData {
  dailyRevenue: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

interface DashboardChartsProps {
  data: ChartData
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
        <div className="bg-black text-white p-4">
          <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
            DAILY REVENUE ({data.dailyRevenue.length} DAYS)
          </h3>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end justify-between gap-2">
            {data.dailyRevenue.map((day, index) => {
              const maxRevenue = Math.max(...data.dailyRevenue.map((d) => d.revenue))
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: "#B9FF16",
                      height: `${height}%`,
                      minHeight: "4px",
                    }}
                    title={`$${day.revenue.toFixed(2)}`}
                  />
                  <span className="text-xs text-gray-500 rotate-45 origin-top-left mt-4">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
        <div className="bg-black text-white p-4">
          <h3 className="text-xl font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
            DAILY ORDERS ({data.dailyRevenue.length} DAYS)
          </h3>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end justify-between gap-2">
            {data.dailyRevenue.map((day, index) => {
              const maxOrders = Math.max(...data.dailyRevenue.map((d) => d.orders))
              const height = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: "#B9FF16",
                      height: `${height}%`,
                      minHeight: "4px",
                    }}
                    title={`${day.orders} orders`}
                  />
                  <span className="text-xs text-gray-500 rotate-45 origin-top-left mt-4">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
