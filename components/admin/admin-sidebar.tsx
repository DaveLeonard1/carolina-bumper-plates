"use client";

import React from 'react';
import { Settings, Home, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator
} from "@/components/ui/sidebar";

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  
  const navigationItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
      description: "View admin dashboard"
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      description: "Manage users"
    },
    {
      title: "Options",
      href: "/admin/options",
      icon: Settings,
      description: "Manage configuration settings"
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-2 px-2 py-1">
          <span className="font-semibold">Admin Panel</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
              >
                <Link href={item.href}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export default AdminSidebar;
