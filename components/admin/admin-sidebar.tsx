"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Settings,
  Activity,
  AlertTriangle,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Stripe Products",
    href: "/admin/stripe-products",
    icon: Package,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "System Health",
    href: "/admin/system-health",
    icon: Activity,
    description: "Monitor system health, webhooks & Zapier automation",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    name: "Reset Database",
    href: "/admin/reset-database",
    icon: AlertTriangle,
    className: "text-red-600 hover:text-red-700",
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
              isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              item.className,
            )}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div>{item.name}</div>
              {item.description && <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
