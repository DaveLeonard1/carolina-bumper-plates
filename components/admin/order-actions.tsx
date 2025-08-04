"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  CreditCard,
  XCircle,
  Truck,
  MessageSquare,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Download,
  RefreshCw,
} from "lucide-react"
import { colorUsage } from "@/lib/colors"
import { ReinvoiceModal } from "./reinvoice-modal"

interface Order {
  id: string
  order_number: string
  status: string
  tracking_number?: string
  shipping_method?: string
  admin_notes?: string
  stripe_invoice_url?: string
  stripe_invoice_pdf?: string
  payment_status?: string
  invoice_status?: string
  reinvoice_count?: number
  last_reinvoice_at?: string
}

interface OrderActionsProps {
  order: Order
  onOrderUpdate: () => void
}

export function OrderActions({ order, onOrderUpdate }: OrderActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "")
  const [shippingMethod, setShippingMethod] = useState(order.shipping_method || "")
  const [adminNote, setAdminNote] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [showReinvoiceModal, setShowReinvoiceModal] = useState(false)

  const handleCreatePaymentLink = async () => {
    setLoading("create_payment_link")
    try {
      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const result = await response.json()

      if (result.success) {
        // Open payment link in new tab
        window.open(result.paymentUrl, "_blank")
        onOrderUpdate()
        alert(`Payment link created successfully! Link opened in new tab.`)
      } else {
        console.error("Payment link creation failed:", result.error)
        alert(`Failed to create payment link: ${result.error}`)
      }
    } catch (error) {
      console.error("Payment link creation error:", error)
      alert("Failed to create payment link")
    } finally {
      setLoading(null)
    }
  }

  const handleAction = async (action: string, data?: any) => {
    setLoading(action)
    try {
      let response: Response

      if (action === "send_invoice") {
        // Use Stripe invoice API
        response = await fetch("/api/stripe/create-invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: order.id }),
        })
      } else {
        // Use existing order update API
        response = await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, data }),
        })
      }

      const result = await response.json()

      if (result.success) {
        onOrderUpdate()
        // Reset forms
        if (action === "add_note") setAdminNote("")
        if (action === "cancel_order") setCancelReason("")

        // Show success message for invoice
        if (action === "send_invoice" && result.invoice) {
          alert(`Invoice created successfully! Invoice URL: ${result.invoice.url}`)
        }
      } else {
        console.error("Action failed:", result.error)
        alert(`Failed to ${action.replace(/_/g, " ")}: ${result.error}`)
      }
    } catch (error) {
      console.error("Action error:", error)
      alert(`Failed to ${action.replace(/_/g, " ")}`)
    } finally {
      setLoading(null)
    }
  }

  const canCreatePaymentLink =
    order.status === "pending" || (order.status === "invoiced" && order.payment_status !== "paid")
  const canSendInvoice = order.status === "pending"
  const canReinvoice =
    (order.status === "invoiced" || order.invoice_status === "sent") && order.payment_status !== "paid"
  const canMarkPaid = (order.status === "invoiced" || order.status === "shipped") && order.payment_status !== "paid"
  const canCancel = order.status === "pending" || order.status === "invoiced"

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Order Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Actions */}
          <div className="grid gap-2">
            <Button
              onClick={() => handleCreatePaymentLink()}
              disabled={!canCreatePaymentLink || loading !== null}
              className="w-full justify-start"
              variant={canCreatePaymentLink ? "default" : "secondary"}
            >
              {loading === "create_payment_link" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Create Payment Link
            </Button>

            <Button
              onClick={() => setShowReinvoiceModal(true)}
              disabled={!canReinvoice || loading !== null}
              className="w-full justify-start"
              variant={canReinvoice ? "default" : "secondary"}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-invoice Order
              {order.reinvoice_count && order.reinvoice_count > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  {order.reinvoice_count}x
                </span>
              )}
            </Button>

            <Button
              onClick={() => handleAction("mark_paid")}
              disabled={!canMarkPaid || loading !== null}
              className="w-full justify-start"
              variant={canMarkPaid ? "default" : "secondary"}
            >
              {loading === "mark_paid" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Mark as Paid
            </Button>

            {/* Cancel Order Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={!canCancel || loading !== null}
                  className="w-full justify-start"
                  variant={canCancel ? "destructive" : "secondary"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Cancel Order #{order.order_number}
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The customer will be notified of the cancellation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cancel-reason">Cancellation Reason</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Enter reason for cancellation..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Keep Order</Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction("cancel_order", { reason: cancelReason })}
                    disabled={loading !== null}
                  >
                    {loading === "cancel_order" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Cancel Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tracking Information */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping & Tracking
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="shipping-method">Shipping Method</Label>
                <Input
                  id="shipping-method"
                  placeholder="e.g., UPS Ground, FedEx Express"
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tracking-number">Tracking Number</Label>
                <Input
                  id="tracking-number"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  handleAction("update_tracking", {
                    tracking_number: trackingNumber,
                    shipping_method: shippingMethod,
                  })
                }
                disabled={loading !== null}
                className="w-full"
                variant="outline"
              >
                {loading === "update_tracking" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                Update Tracking
              </Button>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Admin Notes
            </h4>
            <div className="space-y-3">
              {order.admin_notes && (
                <div className="p-3 rounded text-sm" style={{ backgroundColor: colorUsage.backgroundLight }}>
                  <strong>Current Note:</strong> {order.admin_notes}
                </div>
              )}
              <Textarea
                placeholder="Add internal note about this order..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
              <Button
                onClick={() => handleAction("add_note", { note: adminNote })}
                disabled={!adminNote.trim() || loading !== null}
                className="w-full"
                variant="outline"
              >
                {loading === "add_note" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Add Note
              </Button>
            </div>
          </div>

          {/* Stripe Invoice Information */}
          {(order.stripe_invoice_url || order.stripe_invoice_pdf) && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Stripe Invoice
              </h4>
              <div className="space-y-2">
                {order.stripe_invoice_url && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={order.stripe_invoice_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Invoice
                    </a>
                  </Button>
                )}
                {order.stripe_invoice_pdf && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={order.stripe_invoice_pdf} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Re-invoice Modal */}
      <ReinvoiceModal
        order={order}
        isOpen={showReinvoiceModal}
        onClose={() => setShowReinvoiceModal(false)}
        onSuccess={onOrderUpdate}
      />
    </>
  )
}
