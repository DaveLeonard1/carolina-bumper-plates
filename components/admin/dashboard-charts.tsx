"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

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
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
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
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Orders (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(label) => formatDate(label)} formatter={(value: number) => [value, "Orders"]} />
              <Bar dataKey="orders" fill="#16a34a" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
