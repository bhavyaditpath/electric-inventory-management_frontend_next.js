"use client";

import { useState, useEffect, ReactNode, ComponentType } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import RoleProtectedRoute from "./RoleProtectedRoute";
import Navbar from "./Navbar";
import { UserRole } from "../types/enums";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onMenuItemClick?: () => void;
}

interface LayoutWrapperProps {
  children: ReactNode;
  requiredRole: UserRole;
  SidebarComponent: ComponentType<SidebarProps>;
}

export default function LayoutWrapper({
  children,
  requiredRole,
  SidebarComponent,
}: LayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      if (width >= 1024) setIsMobileOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isTablet && !isMobileOpen) {
      setIsCollapsed(true);
    }
  }, [isTablet, isMobileOpen]);

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <RoleProtectedRoute requiredRole={requiredRole}>
      <div className="flex min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">

        {isMobile && isMobileOpen && (
          <div className="fixed inset-0 z-50 flex">

            <div
              className="absolute inset-0 bg-[var(--theme-overlay)]"
              onClick={closeMobile}
            />

            <div className="relative w-72 max-w-[90vw] bg-[var(--theme-surface)] border-r border-[var(--theme-border)] shadow-xl z-50 transform transition-transform duration-300 translate-x-0">

              <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)]">
                <h2 className="text-lg font-semibold text-[var(--theme-text)]">
                  {requiredRole === UserRole.ADMIN ? "Admin Panel" : "Branch Panel"}
                </h2>

                <button
                  onClick={closeMobile}
                  className="p-2 rounded-md hover:bg-[var(--theme-surface-muted)] text-[var(--theme-text)]"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <SidebarComponent
                isCollapsed={false}
                onToggle={() => { }}
                isMobile={true}
                onMenuItemClick={closeMobile}
              />
            </div>
          </div>
        )}

        {!isMobile && (
          <SidebarComponent
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
          />
        )}

        <main
          className={`
            flex-1 transition-all duration-300
            ${!isMobile ? (isCollapsed ? "ml-16" : "ml-64") : ""}
          `}
        >
          <Navbar
            sidebarOpen={isMobileOpen}
            isMobile={isMobile}
            onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
          />

          <div className="p-0">{children}</div>
        </main>
      </div>
    </RoleProtectedRoute>
  );
}
