import { apiClient } from "./api";
import { AlertPriority, AlertType, AlertStatus } from "../types/enums";

export interface StockAlert {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: null;
  updatedBy: null;
  isRemoved: boolean;
  itemName: string;
  currentStock: string;
  minStock: number;
  shortage: string;
  priority: AlertPriority;
  alertType: AlertType;
  status: AlertStatus;
  resolvedDate?: string | null;
  notes?: string | null;
  branchId: number;
}

export interface AlertsResponse {
  data: StockAlert[];
  total: number;
  page: number;
  limit: number;
}


export const alertApi = {
  getByBranch: (branchId: number, status?: AlertStatus, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/alerts/branch/${branchId}${query}`);
  },

  resolve: (id: number, notes?: string) =>
    apiClient.put<StockAlert>(`/alerts/${id}/resolve`, { notes }),

  dismiss: (id: number, notes?: string) =>
    apiClient.put<StockAlert>(`/alerts/${id}/dismiss`, { notes }),
};