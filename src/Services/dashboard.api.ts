import { apiClient } from "./api";
import { PurchaseTrendQueryParams, PurchaseTrendResponse } from "@/types/dashboard.types";

export const dashboardApi = {
  // Admin Dashboard APIs
  getTotalInventory: () => apiClient.get(`/dashboard/admin/total-inventory`),
  getActiveBranches: () => apiClient.get(`/dashboard/admin/active-branches`),
  getMonthlySales: () => apiClient.get(`/dashboard/admin/monthly-sales`),
  getPendingRequests: () => apiClient.get(`/dashboard/admin/pending-requests`),
  getActiveAlertsList: (userId: number) => apiClient.get(`/dashboard/${userId}/active-alerts-list`),

  // Branch Dashboard APIs
  getCurrentStock: (userId: number) => apiClient.get(`/dashboard/branch/${userId}/current-stock`),
  getActiveAlerts: (userId: number) => apiClient.get(`/dashboard/branch/${userId}/active-alerts`),
  getPendingOrders: () => apiClient.get(`/dashboard/branch/pending-orders`),
  getTodaysBuys: () => apiClient.get(`/dashboard/branch/todays-buys`),

  // Shared Chart APIs
  getPurchaseTrend: (params: PurchaseTrendQueryParams = {}) => {
    const searchParams = new URLSearchParams();

    if (params.period) searchParams.append("period", params.period);
    if (params.productName) searchParams.append("productName", params.productName);
    if (typeof params.branchId === "number") {
      searchParams.append("branchId", String(params.branchId));
    }

    const query = searchParams.toString();
    const endpoint = `/dashboard/purchase-trend${query ? `?${query}` : ""}`;

    return apiClient.get<PurchaseTrendResponse>(endpoint);
  },
};
