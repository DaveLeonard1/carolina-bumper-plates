"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ShoppingCart, User, Clock, Package, DollarSign, Activity, Bell } from "lucide-react"

interface ActivityItem {
  id: string
  type: "order" | "customer"
  title: string
  description: string
  timestamp: string
  status: string
}

interface LiveActivityFeedProps {
  activities: ActivityItem[]
  lastUpdated: string
}

export function LiveActivityFeed({ activities, lastUpdated }: LiveActivityFeedProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "confirmed":
        return "bg-emerald-100 text-emerald-800"
      case "en_route":
      case "en route":
        return "bg-cyan-100 text-cyan-800"
      case "out_for_delivery":
      case "out for delivery":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-600 text-white"
      case "completed":
        return "bg-gray-600 text-white"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return Package
      case "payment":
        return DollarSign
      case "status":
        return Activity
      default:
        return Bell
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Live Activity Feed
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Updated {formatTimeAgo(lastUpdated)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.type)
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      <Icon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      <Badge className={getStatusColor(activity.status)} variant="secondary">
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
