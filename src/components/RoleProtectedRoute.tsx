"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types/enums";

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRole: UserRole;
}

export default function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (user.role === UserRole.ADMIN) {
          router.push("/admin/dashboard");
        } else if (user.role === UserRole.BRANCH) {
          router.push("/branch/dashboard");
        } else {
          router.push("/auth/login");
        }
      }
    }
  }, [user, isLoading, router, requiredRole]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or wrong role
  if (!user || user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}