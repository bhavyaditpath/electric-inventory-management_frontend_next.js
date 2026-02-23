"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  PowerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { tokenManager } from "@/Services/token.management.service";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: HomeIcon },
  { name: "Branches", href: "/admin/branches", icon: BuildingStorefrontIcon },
  { name: "Users", href: "/admin/users", icon: UsersIcon },
  { name: "Inventory", href: "/admin/inventory", icon: CubeIcon },
  { name: "Purchase", href: "/admin/purchase", icon: ShoppingBagIcon },
  { name: "Request", href: "/admin/request", icon: ClipboardDocumentListIcon },
  { name: "Reports", href: "/admin/reports", icon: DocumentChartBarIcon },
  { name: "Chat", href: "/admin/chat", icon: ChatBubbleLeftRightIcon },
  // { name: "Sales", href: "/admin/sales", icon: ChartBarIcon },
  { name: "Alerts", href: "/admin/alert", icon: ExclamationTriangleIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onMenuItemClick?: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggle,
  isMobile = false,
  onMenuItemClick,
}: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    tokenManager.removeToken();
    localStorage.removeItem("theme");
    localStorage.removeItem("adminInventoryColumnConfig");
    window.location.href = "/auth/login";
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
      } bg-[var(--theme-surface)] text-[var(--theme-text)] border-r border-[var(--theme-border)] transition-all duration-300 ease-in-out h-screen ${
        isMobile
          ? "w-full"
          : "fixed left-0 top-0 z-50"
      }`}
    >
      {/* Header - Hide when in mobile overlay since LayoutWrapper provides its own header */}
      {!isMobile && (
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--theme-border)]">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-[var(--theme-text)] truncate">
              Admin Panel
            </h2>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-[var(--theme-surface-muted)] transition-colors flex-shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-[var(--theme-text-muted)]" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-[var(--theme-text-muted)]" />
            )}
          </button>
        </div>
      )}

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
                    ? "bg-blue-500/15 text-blue-600 border-r-2 border-blue-600"
                    : "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)] hover:text-blue-600"
                } ${isMobile ? 'text-base' : ''}`}
              >
              <item.icon
                className={`w-5 h-5 lg:w-5 lg:h-5 flex-shrink-0 ${
                  isCollapsed ? "mx-auto" : "mr-3"
                } ${isActive ? 'text-blue-600' : 'text-[var(--theme-text-muted)] group-hover:text-blue-500'}`}
              />
              {!isCollapsed && (
                <span className="font-medium truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      {/* <div className="p-3 lg:p-4 border-t border-[var(--theme-border)] mt-auto">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-3 lg:py-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-all duration-200 group ${
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
      </div> */}
    </div>
  );
}
