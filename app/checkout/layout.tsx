import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout - Pre-Order Hi-Temp Bumper Plates",
  description: "Complete your pre-order for factory second Hi-Temp bumper plates at wholesale prices. No payment required until batch is ready.",
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
