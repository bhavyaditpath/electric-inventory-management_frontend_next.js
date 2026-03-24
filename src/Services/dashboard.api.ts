import { apiClient } from "./api";
import {
  PurchaseTrendQueryParams,
  PurchaseTrendResponse,
  SalesPurchaseTrendQueryParams,
  SalesPurchaseTrendResponse,
  StockHealthDistributionQueryParams,
  StockHealthDistributionResponse,
} from "@/types/dashboard.types";

const toQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

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
    const endpoint = `/dashboard/purchase-trend${toQueryString({
      period: params.period,
      productName: params.productName,
      branchId: params.branchId,
    })}`;

    return apiClient.get<PurchaseTrendResponse>(endpoint);
  },

  getSalesVsPurchaseTrend: (params: SalesPurchaseTrendQueryParams = {}) => {
    const endpoint = `/dashboard/sales-vs-purchase-trend${toQueryString({
      period: params.period,
      productName: params.productName,
      branchId: params.branchId,
    })}`;

    return apiClient.get<SalesPurchaseTrendResponse>(endpoint);
  },

  getStockHealthDistribution: (params: StockHealthDistributionQueryParams = {}) => {
    const endpoint = `/dashboard/stock-health-distribution${toQueryString({
      search: params.search,
      branchId: params.branchId,
    })}`;

    return apiClient.get<StockHealthDistributionResponse>(endpoint);
  },
};
