import { InventoryItem } from "@/app/admin/inventory/page";
import { apiClient } from "./api";
import { PaginatedResponse } from "@/types/api-types";

export interface InventoryQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const inventoryApi = {
  getAll: (params?: InventoryQueryParams) => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.pageSize) searchParams.append("pageSize", String(params.pageSize));
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const queryString = searchParams.toString();
    return apiClient.get<PaginatedResponse<InventoryItem>>(
      `/inventory${queryString ? `?${queryString}` : ""}`
    );
  },

  getStockSummary: (params?: { search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);

    const queryString = searchParams.toString();
    return apiClient.get<{
      low: number;
      warning: number;
      good: number;
    }>(`/inventory/summary${queryString ? `?${queryString}` : ""}`);
  }
};
