"use client";

import { useEffect, useState } from "react";
import { branchApi } from "@/Services/branch.api";
import { useAuth } from "@/contexts/AuthContext";
import { Branch } from "@/types/api-types";
import { BranchOption } from "@/types/dashboard.types";
import { UserRole } from "@/types/enums";

function unwrapApiData<T>(response: unknown): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function useBranchOptions() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!isAdmin) {
        setBranchOptions([]);
        return;
      }

      try {
        const response = await branchApi.getAllWithoutPagination();
        const payload = unwrapApiData<Branch[]>(response);
        const items = Array.isArray(payload) ? payload : [];
        setBranchOptions(items.map((item) => ({ id: item.id, name: item.name })));
      } catch {
        setBranchOptions([]);
      }
    };

    fetchBranches();
  }, [isAdmin]);

  return { isAdmin, branchOptions };
}
