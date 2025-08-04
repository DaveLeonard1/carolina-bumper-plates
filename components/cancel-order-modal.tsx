"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, AlertTriangle, Loader2 } from "lucide-react"
import { colorUsage } from "@/lib/colors"

interface CancelOrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderNumber: string
  orderTotal: number
  onCancel: (reason: string) => Promise<void>
  isLoading: boolean
}

export function CancelOrderModal({
  isOpen,
  onClose,
  orderNumber,
  orderTotal,
  onCancel,
  isLoading,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("")
  const [selectedReason, setSelectedReason] = useState("")

  const predefinedReasons = [
    "Changed my mind",
    "Found a better deal elsewhere",
    "No longer need the items",
    "Ordered by mistake",
    "Financial reasons",
    "Other (please specify below)",
  ]

  const handleCancel = async () => {
    const finalReason = selectedReason === "Other (please specify below)" ? reason : selectedReason
    if (!finalReason.trim()) {
      return
    }
    await onCancel(finalReason)
  }

  const handleReasonSelect = (selectedValue: string) => {
    setSelectedReason(selectedValue)
    if (selectedValue !== "Other (please specify below)") {
      setReason("")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-bold">Cancel Order</h3>
            </div>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Order Info */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colorUsage.backgroundLight }}>
            <p className="font-semibold">Order #{orderNumber}</p>
            <p className="text-sm" style={{ color: colorUsage.textMuted }}>
              Total: ${orderTotal.toFixed(2)}
            </p>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Important Notice</p>
                <p className="text-sm text-red-700 mt-1">
                  Once cancelled, this order cannot be restored. You'll need to place a new order if you change your
                  mind.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">Please tell us why you're cancelling this order:</Label>
            <div className="space-y-2">
              {predefinedReasons.map((reasonOption) => (
                <label key={reasonOption} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="cancellation-reason"
                    value={reasonOption}
                    checked={selectedReason === reasonOption}
                    onChange={(e) => handleReasonSelect(e.target.value)}
                    className="text-blue-600"
                    disabled={isLoading}
                  />
                  <span className="text-sm">{reasonOption}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === "Other (please specify below)" && (
            <div className="mb-6">
              <Label htmlFor="custom-reason" className="text-sm font-semibold">
                Please specify your reason:
              </Label>
              <Textarea
                id="custom-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please tell us more about why you're cancelling..."
                className="mt-2"
                rows={3}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Keep Order
            </Button>
            <Button
              onClick={handleCancel}
              disabled={
                isLoading || !selectedReason || (selectedReason === "Other (please specify below)" && !reason.trim())
              }
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Order"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
