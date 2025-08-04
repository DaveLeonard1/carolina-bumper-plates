"use client"

import React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, AlertTriangle, Loader2, ExternalLink, RefreshCw, Clock } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface InvoiceHistoryItem {
  id: number
  event_type: string
  event_description: string
  event_data: any
  created_at: string
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status?: string
  invoice_status?: string
  reinvoice_count?: number
  last_reinvoice_at?: string
  stripe_invoice_url?: string
}

interface ReinvoiceModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ReinvoiceModal({ order, isOpen, onClose, onSuccess }: ReinvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const canReinvoice = order.payment_status !== "paid" && order.status !== "cancelled"

  const handleReinvoice = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/reinvoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Order #${order.order_number} has been re-invoiced successfully!`)
        onSuccess()
        await loadInvoiceHistory() // Refresh history
      } else {
        setError(result.error || "Failed to re-invoice order")
      }
    } catch (error) {
      console.error("Re-invoice error:", error)
      setError("Failed to re-invoice order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/invoice-history`)
      const result = await response.json()

      if (result.success) {
        setInvoiceHistory(result.history || [])
      }
    } catch (error) {
      console.error("Failed to load invoice history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Load invoice history when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadInvoiceHistory()
    }
  }, [isOpen, order.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "invoice_sent":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "invoice_resent":
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      case "payment_received":
        return <Clock className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Re-invoice Order #{order.order_number}
          </DialogTitle>
          <DialogDescription>
            Generate a new invoice for this unpaid order. The customer will receive a fresh invoice via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="grid gap-4 p-4 rounded-lg" style={{ backgroundColor: colorUsage.backgroundLight }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Order Status
                </p>
                <Badge
                  className={
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "invoiced"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Payment Status
                </p>
                <Badge
                  className={
                    order.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }
                >
                  {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                </Badge>
              </div>
            </div>

            {order.reinvoice_count && order.reinvoice_count > 0 && (
              <div>
                <p className="text-sm font-medium" style={{ color: colorUsage.textMuted }}>
                  Previous Re-invoices
                </p>
                <p className="text-sm">
                  {order.reinvoice_count} time{order.reinvoice_count !== 1 ? "s" : ""}
                  {order.last_reinvoice_at && (
                    <span style={{ color: colorUsage.textMuted }}> (last: {formatDate(order.last_reinvoice_at)})</span>
                  )}
                </p>
              </div>
            )}

            {order.stripe_invoice_url && (
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colorUsage.textMuted }}>
                  Current Invoice
                </p>
                <Button asChild variant="outline" size="sm">
                  <a href={order.stripe_invoice_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Current Invoice
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Re-invoice Action */}
          {!canReinvoice && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {order.payment_status === "paid"
                  ? "This order has already been paid and cannot be re-invoiced."
                  : "This order is cancelled and cannot be re-invoiced."}
              </AlertDescription>
            </Alert>
          )}

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Invoice History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Invoice History</h4>
              <Button onClick={loadInvoiceHistory} variant="outline" size="sm" disabled={historyLoading}>
                {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>

            {historyLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  Loading invoice history...
                </p>
              </div>
            ) : invoiceHistory.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {invoiceHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded border"
                    style={{ backgroundColor: colorUsage.backgroundLight }}
                  >
                    {getEventIcon(item.event_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.event_description}</p>
                      <p className="text-xs" style={{ color: colorUsage.textMuted }}>
                        {formatDate(item.created_at)}
                      </p>
                      {item.event_data?.invoice_url && (
                        <a
                          href={item.event_data.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Invoice
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colorUsage.textMuted }}>
                No invoice history available
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
          {canReinvoice && (
            <Button onClick={handleReinvoice} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Re-invoicing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-invoice Order
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
