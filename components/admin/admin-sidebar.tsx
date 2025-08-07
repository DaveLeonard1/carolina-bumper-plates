import React from 'react';
import { Settings } from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const navigationItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: "DashboardIcon",
      description: "View admin dashboard"
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: "UsersIcon",
      description: "Manage users"
    },
    {
      title: "Options",
      href: "/admin/options",
      icon: Settings,
      description: "Manage configuration settings"
    },
    // ** rest of code here **
  ];

  return (
    <div>
      {/* Sidebar navigation code here */}
    </div>
  );
};

export default AdminSidebar;
