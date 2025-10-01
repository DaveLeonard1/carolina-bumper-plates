"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { colorUsage } from "@/lib/colors"

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
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue Chart */}
      <Card className="bg-black text-white border-0">
        <CardHeader style={{ backgroundColor: colorUsage.accent }}>
          <CardTitle className="font-bold" style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnAccent }}>
            DAILY REVENUE (30 DAYS)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(label) => formatDate(label)}
                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={colorUsage.accent}
                strokeWidth={2}
                dot={{ fill: colorUsage.accent, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card className="bg-black text-white border-0">
        <CardHeader style={{ backgroundColor: colorUsage.accent }}>
          <CardTitle className="font-bold" style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnAccent }}>
            DAILY ORDERS (30 DAYS)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12, fill: "#999" }} />
              <YAxis tick={{ fontSize: 12, fill: "#999" }} />
              <Tooltip labelFormatter={(label) => formatDate(label)} formatter={(value: number) => [value, "Orders"]} />
              <Bar dataKey="orders" fill={colorUsage.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
