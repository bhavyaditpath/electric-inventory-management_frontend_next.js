import { apiClient } from "./api";

export const dashboardApi = {
  // Admin Dashboard APIs
  getTotalInventory: (userId: number) => apiClient.get(`/dashboard/admin/${userId}/total-inventory`),
  getActiveBranches: (userId: number) => apiClient.get(`/dashboard/admin/${userId}/active-branches`),
  getMonthlySales: (userId: number) => apiClient.get(`/dashboard/admin/${userId}/monthly-sales`),
  getPendingRequests: (userId: number) => apiClient.get(`/dashboard/admin/${userId}/pending-requests`),

  // Branch Dashboard APIs
  getCurrentStock: (userId: number) => apiClient.get(`/dashboard/branch/${userId}/current-stock`),
  getActiveAlerts: (userId: number) => apiClient.get(`/dashboard/branch/${userId}/active-alerts`),
  getPendingOrders: (userId: number) => apiClient.get(`/dashboard/branch/${userId}/pending-orders`),
  getTodaysSales: (userId: number) => apiClient.get(`/dashboard/branch/${userId}/todays-sales`),
};