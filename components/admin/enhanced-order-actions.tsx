"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  CreditCard,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Lock,
  Copy,
  CheckCircle,
  Bug,
  Search,
  Mail,
  Package,
  Truck,
  MapPin,
  CheckCheck,
  ChevronDown,
  ChevronUp,
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
  payment_link_url?: string
  payment_link_created_at?: string
  order_locked?: boolean
  order_locked_reason?: string
  paid_at?: string
}

interface OrderActionsProps {
  order: Order
  onOrderUpdate: () => void
}

export function EnhancedOrderActions({ order, onOrderUpdate }: OrderActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "")
  const [shippingMethod, setShippingMethod] = useState(order.shipping_method || "")
  const [adminNote, setAdminNote] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [showReinvoiceModal, setShowReinvoiceModal] = useState(false)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(order.payment_link_url || "")
  const [paymentLinkCreatedAt, setPaymentLinkCreatedAt] = useState(order.payment_link_created_at || "")
  const [copySuccess, setCopySuccess] = useState(false)
  const [isPaymentSectionOpen, setIsPaymentSectionOpen] = useState(order.payment_status !== "paid")

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
        setPaymentLinkUrl(result.paymentUrl)
        setPaymentLinkCreatedAt(result.createdAt)
        onOrderUpdate()

        if (result.alreadyExists) {
          alert("Payment link already exists for this order!")
        } else {
          alert("Payment link created successfully! Order is now locked from modifications.")
        }
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

  const handleCopyPaymentLink = async () => {
    if (!paymentLinkUrl) return

    try {
      await navigator.clipboard.writeText(paymentLinkUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error("Failed to copy payment link:", error)
      alert("Failed to copy payment link")
    }
  }

  const handleViewPaymentLink = () => {
    if (paymentLinkUrl) {
      window.open(paymentLinkUrl, "_blank")
    }
  }

  const handleResendReceipt = async () => {
    setLoading("resend_receipt")
    try {
      const response = await fetch("/api/admin/resend-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Payment receipt sent successfully to ${result.recipient}`)
        onOrderUpdate()
      } else {
        console.error("Resend receipt failed:", result.error)
        alert(`Failed to send receipt: ${result.error}`)
      }
    } catch (error) {
      console.error("Resend receipt error:", error)
      alert("Failed to send receipt")
    } finally {
      setLoading(null)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(`status_${newStatus}`)
    try {
      const response = await fetch("/api/admin/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          orderId: order.id,
          status: newStatus,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Order status updated to ${newStatus.replace(/_/g, " ")}`)
        onOrderUpdate()
      } else {
        console.error("Status update failed:", result.error)
        alert(`Failed to update status: ${result.error}`)
      }
    } catch (error) {
      console.error("Status update error:", error)
      alert("Failed to update status")
    } finally {
      setLoading(null)
    }
  }

  const handleAction = async (action: string, data?: any) => {
    // Check if order is locked for certain actions
    if (order.order_locked && ["update_items", "update_address"].includes(action)) {
      alert("This order is locked and cannot be modified because a payment link has been created.")
      return
    }

    setLoading(action)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, data }),
      })

      const result = await response.json()

      if (result.success) {
        onOrderUpdate()
        if (action === "add_note") setAdminNote("")
        if (action === "cancel_order") setCancelReason("")
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

  const hasPaymentLink = !!paymentLinkUrl
  const canMarkPaid = (order.status === "invoiced" || order.status === "shipped") && order.payment_status !== "paid"
  const canCancel = order.status === "pending" || order.status === "invoiced"

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleString()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Order Actions
            {order.order_locked && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Lock Status Alert */}
          {order.order_locked && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Order Locked:</strong> {order.order_locked_reason || "Modifications restricted"}
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Link Section */}
          <Collapsible open={isPaymentSectionOpen} onOpenChange={setIsPaymentSectionOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {order.payment_status === "paid" ? "Payment Details" : "Payment Link"}
                </h4>
                {isPaymentSectionOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-3 pt-3">
              {order.payment_status === "paid" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Payment received successfully</span>
                    {order.paid_at && <span className="text-gray-500">on {formatDate(order.paid_at)}</span>}
                  </div>

                  {hasPaymentLink && (
                    <div className="text-xs text-gray-500">
                      <span>Payment link: </span>
                      <span className="font-mono break-all">{paymentLinkUrl}</span>
                    </div>
                  )}

                  {/* Resend Receipt Button */}
                  <Button
                    onClick={handleResendReceipt}
                    disabled={loading !== null}
                    className="w-full"
                    variant="outline"
                  >
                    {loading === "resend_receipt" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Resend Payment Receipt
                  </Button>
                </div>
              ) : (
              <>
                {!hasPaymentLink ? (
                  <Button
                    onClick={handleCreatePaymentLink}
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
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Payment link created</span>
                      {paymentLinkCreatedAt && (
                        <span className="text-gray-500">on {formatDate(paymentLinkCreatedAt)}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleViewPaymentLink} className="flex-1" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Payment Link
                      </Button>

                      <Button onClick={handleCopyPaymentLink} variant="outline" size="sm">
                        {copySuccess ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {copySuccess && (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Payment link copied to clipboard!
                      </div>
                    )}

                    <div className="p-3 bg-gray-50 rounded text-xs font-mono break-all">{paymentLinkUrl}</div>
                  </div>
                )}
              </>
            )}
            </CollapsibleContent>
          </Collapsible>

          {/* Webhook Diagnostics */}
          

          {/* Other Actions */}
          <div className="border-t pt-4">
            <div className="grid gap-2">
              <Button
                onClick={() => handleAction("mark_paid")}
                disabled={order.payment_status === "paid" || !canMarkPaid || loading !== null}
                className="w-full justify-start"
                variant={order.payment_status === "paid" ? "secondary" : canMarkPaid ? "default" : "secondary"}
              >
                {loading === "mark_paid" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : order.payment_status === "paid" ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {order.payment_status === "paid" ? "Already Paid" : "Mark as Paid"}
              </Button>

              {/* Cancel Order Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    disabled={order.payment_status === "paid" || !canCancel || loading !== null}
                    className="w-full justify-start"
                    variant={order.payment_status === "paid" ? "secondary" : canCancel ? "destructive" : "secondary"}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {order.payment_status === "paid" ? "Cannot Cancel (Paid)" : "Cancel Order"}
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
                      {order.order_locked && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <strong>Note:</strong> This order is currently locked due to payment link creation.
                        </div>
                      )}
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
          </div>

          {/* Order Status Management */}
          {order.payment_status === "paid" && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Status
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleStatusUpdate("confirmed")}
                    disabled={loading !== null || order.status === "confirmed"}
                    variant={order.status === "confirmed" ? "default" : "outline"}
                    className="w-full text-sm"
                  >
                    {loading === "status_confirmed" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirmed
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("en_route")}
                    disabled={loading !== null || order.status === "en_route"}
                    variant={order.status === "en_route" ? "default" : "outline"}
                    className="w-full text-sm"
                  >
                    {loading === "status_en_route" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 mr-2" />
                    )}
                    En Route
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("out_for_delivery")}
                    disabled={loading !== null || order.status === "out_for_delivery"}
                    variant={order.status === "out_for_delivery" ? "default" : "outline"}
                    className="w-full text-sm"
                  >
                    {loading === "status_out_for_delivery" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    Out For Delivery
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("delivered")}
                    disabled={loading !== null || order.status === "delivered"}
                    variant={order.status === "delivered" ? "default" : "outline"}
                    className="w-full text-sm"
                  >
                    {loading === "status_delivered" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4 mr-2" />
                    )}
                    Delivered
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Information */}

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
