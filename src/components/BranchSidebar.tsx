"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PowerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { tokenManager } from "@/Services/token.management.service";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", href: "/branch/dashboard", icon: HomeIcon },
  { name: "Inventory", href: "/branch/inventory", icon: CubeIcon },
  { name: "Purchase", href: "/branch/purchase", icon: ShoppingBagIcon },
  { name: "Sales", href: "/branch/sales", icon: ChartBarIcon },
  { name: "Alerts", href: "/branch/alerts", icon: ExclamationTriangleIcon },
];

interface BranchSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export default function BranchSidebar({ isCollapsed, onToggle, isMobile = false }: BranchSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    tokenManager.removeToken();
    router.push("/auth/login");
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white shadow-lg transition-all duration-300 ease-in-out h-screen ${
        isMobile ? "" : "fixed left-0 top-0 z-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-800">Branch Panel</h2>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"}`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <PowerIcon
            className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`}
          />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}