import { apiClient } from "./api";

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const branchApi = {
  getAll: (params?: PaginationParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder.toUpperCase());
    
    const queryString = searchParams.toString();
    return apiClient.get(`/branch${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: number) => apiClient.get(`/branch/${id}`),
  create: (branchData: { name: string; address: string; phone: string }) =>
    apiClient.post('/branch', branchData),
  update: (id: number, branchData: Partial<{ name: string; address: string; phone: string }>) =>
    apiClient.patch(`/branch/${id}`, branchData),
  delete: (id: number) => apiClient.delete(`/branch/${id}`),
};