"use client";

import LayoutWrapper from "../../components/LayoutWrapper";
import Sidebar from "../../components/Sidebar";
import { UserRole } from "../../types/enums";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutWrapper requiredRole={UserRole.ADMIN} SidebarComponent={Sidebar}>
      {children}
    </LayoutWrapper>
  );
}