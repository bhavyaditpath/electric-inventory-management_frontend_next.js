"use client";

import LayoutWrapper from "../../components/LayoutWrapper";
import BranchSidebar from "../../components/BranchSidebar";
import { UserRole } from "../../types/enums";

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutWrapper requiredRole={UserRole.BRANCH} SidebarComponent={BranchSidebar}>
      {children}
    </LayoutWrapper>
  );
}