"use client"

import { Dumbbell } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { colorUsage } from "@/lib/colors"
import { useBusinessSettings } from "@/hooks/use-options"
import { ReactNode } from "react"

interface PageHeaderProps {
  children?: ReactNode
}

export default function PageHeader({ children }: PageHeaderProps) {
  // Use the centralized business settings hook to get dynamic business info
  const { businessName } = useBusinessSettings()

  return (
    <header
      className="border-b px-4 py-4"
      style={{ backgroundColor: colorUsage.backgroundPrimary, borderColor: colorUsage.border }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-8 w-8" style={{ color: colorUsage.textPrimary }} />
          <span className="text-xl font-bold">{businessName.toUpperCase()}</span>
        </div>
        <div className="flex gap-2">
          {children}
          {!children && (
            <Link href="/">
              <Button variant="outline" className="font-semibold">
                Return Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
