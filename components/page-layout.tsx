import type React from "react"
import { TopBar } from "@/components/top-bar"
import { Header } from "@/components/header"

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Header />
      <main>{children}</main>
    </div>
  )
}
