"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  DocumentChartBarIcon,
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
  { name: "Requested Purchase", href: "/branch/requestedpurchase", icon: ClipboardDocumentListIcon },
  { name: "Reports", href: "/branch/reports", icon: DocumentChartBarIcon },
  { name: "Sales", href: "/branch/sales", icon: ChartBarIcon },
  { name: "Alerts", href: "/branch/alerts", icon: ExclamationTriangleIcon },
];

interface BranchSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onMenuItemClick?: () => void;
}

export default function BranchSidebar({ isCollapsed, onToggle, isMobile = false, onMenuItemClick }: BranchSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    tokenManager.removeToken();
    router.push("/auth/login");
  };

  const handleMenuClick = () => {
    // Close mobile menu when a menu item is clicked
    if (isMobile && onMenuItemClick) {
      onMenuItemClick();
    }
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white shadow-lg transition-all duration-300 ease-in-out h-screen ${
        isMobile
          ? "w-full border-r border-gray-200"
          : "fixed left-0 top-0 z-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 lg:p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-base lg:text-lg font-semibold text-gray-800 truncate">
            Branch Panel
          </h2>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 lg:px-3 py-3 lg:py-4 space-y-1 lg:space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleMenuClick}
              className={`flex items-center px-3 py-3 lg:py-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
              } ${isMobile ? 'text-base' : ''}`}
            >
              <item.icon
                className={`w-5 h-5 lg:w-5 lg:h-5 flex-shrink-0 ${
                  isCollapsed ? "mx-auto" : "mr-3"
                } ${isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-green-500'}`}
              />
              {!isCollapsed && (
                <span className="font-medium truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 lg:p-4 border-t border-gray-200 mt-auto">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-3 lg:py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group ${
            isCollapsed ? "justify-center" : ""
          } ${isMobile ? 'text-base' : ''}`}
        >
          <PowerIcon
            className={`w-5 h-5 flex-shrink-0 ${
              isCollapsed ? "" : "mr-3"
            } text-red-500 group-hover:text-red-600`}
          />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}