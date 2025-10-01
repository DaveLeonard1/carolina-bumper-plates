"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { colorUsage } from "@/lib/colors"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Settings,
  AlertTriangle,
  User,
  LogOut,
} from "lucide-react"
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/auth-context"

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
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    name: "Reset Database",
    href: "/admin/reset-database",
    icon: AlertTriangle,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <Sidebar className="bg-black border-r-0 opacity-100">
      <SidebarHeader className="p-4 opacity-100" style={{ backgroundColor: colorUsage.accent }}>
        <h2 className="font-black text-lg" style={{ fontFamily: "Oswald, sans-serif", color: colorUsage.textOnAccent }}>
          ADMIN MENU
        </h2>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4 bg-black opacity-100">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const isReset = item.name === "Reset Database"
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium transition-colors uppercase",
                  isActive
                    ? "text-white"
                    : isReset
                      ? "text-red-400 hover:text-red-300"
                      : "text-gray-400 hover:text-white",
                )}
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <div>{item.name}</div>
              </Link>
            )
          })}
        </nav>
      </SidebarContent>
      <SidebarFooter className="p-2 bg-black opacity-100 border-t border-gray-800">
        <nav className="space-y-1">
          <Link
            href="/my-account"
            className="group flex items-center px-3 py-2 text-sm font-medium transition-colors uppercase text-gray-400 hover:text-white"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            <User className="mr-3 h-5 w-5 flex-shrink-0" />
            <div>MY ACCOUNT</div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium transition-colors uppercase text-gray-400 hover:text-white"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            <div>LOG OUT</div>
          </button>
        </nav>
      </SidebarFooter>
    </Sidebar>
  )
}
