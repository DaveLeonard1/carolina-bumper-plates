import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { colorUsage } from "@/lib/colors"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: colorUsage.backgroundLight }}>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header
            className="flex h-16 shrink-0 items-center gap-2 border-b px-4"
            style={{ borderColor: colorUsage.border }}
          >
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="font-semibold">Admin Dashboard</h1>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
