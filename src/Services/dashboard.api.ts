import { apiClient } from "./api";

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
};