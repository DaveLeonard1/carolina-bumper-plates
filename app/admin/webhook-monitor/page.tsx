"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, RefreshCw, Eye, Play } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface WebhookLog {
  id: number
  order_id: number
  webhook_url: string
  response_status: number
  response_time_ms: number
  success: boolean
  error_message: string | null
  retry_count: number
  created_at: string
}

interface WebhookQueue {
  id: number
  order_id: number
  status: string
  attempts: number
  max_attempts: number
  next_retry_at: string
  error_message: string | null
  created_at: string
}

export default function WebhookMonitorPage() {
  const [stats, setStats] = useState({
    total_sent: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    avg_response_time: 0,
  })
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [queue, setQueue] = useState<WebhookQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch stats
      const statsResponse = await fetch("/api/admin/zapier-webhook-stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.stats)
        }
      }

      // Fetch recent logs
      const logsResponse = await fetch("/api/admin/webhook-logs")
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        if (logsData.success) {
          setLogs(logsData.logs)
        }
      }

      // Fetch queue
      const queueResponse = await fetch("/api/admin/webhook-queue")
      if (queueResponse.ok) {
        const queueData = await queueResponse.json()
        if (queueData.success) {
          setQueue(queueData.queue)
        }
      }
    } catch (error) {
      console.error("Error fetching webhook data:", error)
    } finally {
      setLoading(false)
    }
  }

  const processQueue = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/process-webhook-queue", {
        method: "POST",
      })

      if (response.ok) {
        await fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error processing queue:", error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (success: boolean, status: number) => {
    if (success) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>
    } else if (status >= 400 && status < 500) {
      return <Badge className="bg-yellow-100 text-yellow-800">Client Error</Badge>
    } else if (status >= 500) {
      return <Badge className="bg-red-100 text-red-800">Server Error</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    }
  }

  const getQueueStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading webhook monitor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Oswald, sans-serif" }}>
            Webhook Monitor
          </h1>
          <p style={{ color: colorUsage.textMuted }}>Monitor Zapier webhook deliveries and queue status</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={processQueue} disabled={processing}>
            <Play className="h-4 w-4 mr-2" />
            {processing ? "Processing..." : "Process Queue"}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_sent}</div>
            <div className="text-sm text-blue-700">Total Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
            <div className="text-sm text-green-700">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-700">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avg_response_time}ms</div>
            <div className="text-sm text-purple-700">Avg Response</div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Webhook Queue ({queue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-center py-8" style={{ color: colorUsage.textMuted }}>
              No webhooks in queue
            </p>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Order #{item.order_id}</span>
                      {getQueueStatusBadge(item.status)}
                    </div>
                    <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                      Attempts: {item.attempts}/{item.max_attempts} • Next retry:{" "}
                      {new Date(item.next_retry_at).toLocaleString()}
                    </div>
                    {item.error_message && <div className="text-sm text-red-600 mt-1">Error: {item.error_message}</div>}
                  </div>
                  <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Webhook Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Webhook Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center py-8" style={{ color: colorUsage.textMuted }}>
              No webhook logs found
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Order #{log.order_id}</span>
                      {getStatusBadge(log.success, log.response_status)}
                      <span className="text-sm" style={{ color: colorUsage.textMuted }}>
                        {log.response_time_ms}ms
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                      Status: {log.response_status} • Retries: {log.retry_count} • URL:{" "}
                      {log.webhook_url.substring(0, 50)}...
                    </div>
                    {log.error_message && <div className="text-sm text-red-600 mt-1">Error: {log.error_message}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm" style={{ color: colorUsage.textMuted }}>
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
