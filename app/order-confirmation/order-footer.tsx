"use client"

import Link from "next/link"
import { colorUsage } from "@/lib/colors"
import { useBusinessSettings } from "@/hooks/use-options"

interface OrderFooterProps {
  orderNumber?: string
}

export default function OrderFooter({ orderNumber }: OrderFooterProps) {
  // Use the centralized business settings hook to get dynamic business info
  const { businessEmail } = useBusinessSettings()

  return (
    <div className="text-center mt-8">
      <p style={{ color: colorUsage.textMuted }}>
        {orderNumber ? (
          <>
            Have questions about your order?{" "}
            <a
              href={`mailto:${businessEmail}`}
              className="underline"
              style={{ color: colorUsage.textOnLight }}
            >
              Contact us
            </a>
          </>
        ) : (
          <>
            Need help finding an order?{" "}
            <Link
              href="/order-lookup"
              className="underline"
              style={{ color: colorUsage.textOnLight }}
            >
              Look up by phone or email
            </Link>
          </>
        )}
      </p>
      <p className="mt-2" style={{ color: colorUsage.textMuted }}>
        Or email us directly at{" "}
        <a
          href={`mailto:${businessEmail}`}
          className="underline"
          style={{ color: colorUsage.textOnLight }}
        >
          {businessEmail}
        </a>
      </p>
    </div>
  )
}
