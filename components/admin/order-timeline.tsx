"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  AlertCircle,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface TimelineEvent {
  id: number
  event_type: string
  event_description: string
  event_data: any
  created_by: string
  created_at: string
}

interface OrderTimelineProps {
  timeline: TimelineEvent[]
}

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "order_created":
        return <Package className="h-4 w-4" />
      case "status_changed":
        return <Clock className="h-4 w-4" />
      case "invoice_sent":
        return <FileText className="h-4 w-4" />
      case "payment_received":
        return <CreditCard className="h-4 w-4" />
      case "tracking_updated":
        return <Truck className="h-4 w-4" />
      case "order_cancelled":
        return <XCircle className="h-4 w-4" />
      case "note_added":
        return <MessageSquare className="h-4 w-4" />
      case "order_completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "order_created":
        return "bg-blue-100 text-blue-800"
      case "invoice_sent":
        return "bg-purple-100 text-purple-800"
      case "payment_received":
        return "bg-green-100 text-green-800"
      case "tracking_updated":
        return "bg-orange-100 text-orange-800"
      case "order_cancelled":
        return "bg-red-100 text-red-800"
      case "note_added":
        return "bg-gray-100 text-gray-800"
      case "order_completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4" style={{ color: colorUsage.textDisabled }} />
            <p style={{ color: colorUsage.textMuted }}>No timeline events available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Order Timeline ({timeline.length} events)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => {
            const { date, time } = formatDate(event.created_at)
            const isLast = index === timeline.length - 1

            return (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-6 top-12 w-0.5 h-8" style={{ backgroundColor: colorUsage.border }} />
                )}

                <div className="flex gap-4">
                  {/* Event icon */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colorUsage.backgroundLight }}
                  >
                    <div style={{ color: colorUsage.textPrimary }}>{getEventIcon(event.event_type)}</div>
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getEventColor(event.event_type)}>
                            {event.event_type.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                            by {event.created_by}
                          </span>
                        </div>

                        <p className="text-sm font-medium mb-1">{event.event_description}</p>

                        {/* Additional event data */}
                        {event.event_data && Object.keys(event.event_data).length > 0 && (
                          <div
                            className="mt-2 p-2 rounded text-xs"
                            style={{ backgroundColor: colorUsage.backgroundLight }}
                          >
                            {event.event_type === "tracking_updated" && event.event_data.tracking_number && (
                              <div>
                                <strong>Tracking:</strong> {event.event_data.tracking_number}
                                {event.event_data.shipping_method && (
                                  <span> via {event.event_data.shipping_method}</span>
                                )}
                              </div>
                            )}
                            {event.event_type === "order_cancelled" && event.event_data.reason && (
                              <div>
                                <strong>Reason:</strong> {event.event_data.reason}
                              </div>
                            )}
                            {event.event_type === "note_added" && event.event_data.note && (
                              <div>
                                <strong>Note:</strong> {event.event_data.note}
                              </div>
                            )}
                            {event.event_data.previous_status && (
                              <div>
                                <strong>Previous Status:</strong> {event.event_data.previous_status}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-right text-xs" style={{ color: colorUsage.textMuted }}>
                        <div>{date}</div>
                        <div>{time}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
