import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch",
  description: "Contact The Plate Yard for questions about Hi-Temp factory second bumper plates, batch orders, or wholesale pricing.",
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
