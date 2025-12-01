"use client";

import { useState, useEffect, ReactNode, ComponentType } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import RoleProtectedRoute from "./RoleProtectedRoute";
import { UserRole } from "../types/enums";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

interface LayoutWrapperProps {
  children: ReactNode;
  requiredRole: UserRole;
  SidebarComponent: ComponentType<SidebarProps>;
}

export default function LayoutWrapper({
  children,
  requiredRole,
  SidebarComponent
}: LayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <RoleProtectedRoute requiredRole={requiredRole}>
      <div className="min-h-screen bg-gray-100">
        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {requiredRole === 'ADMIN' ? 'Admin Panel' : 'Branch Panel'}
            </h1>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <div className="relative flex w-full max-w-xs flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {requiredRole === 'ADMIN' ? 'Admin Menu' : 'Branch Menu'}
                </h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarComponent
                  isCollapsed={false} // Mobile sidebar is always expanded
                  onToggle={() => {}} // No toggle needed for mobile
                  isMobile={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden md:flex min-h-screen">
          <SidebarComponent
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? "ml-16" : "ml-64"
            }`}
          >
            {children}
          </main>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}