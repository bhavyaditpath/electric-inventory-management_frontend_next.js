import { apiClient } from "./api";

export const branchApi = {
  getAll: () => apiClient.get('/branch'),
  getById: (id: number) => apiClient.get(`/branch/${id}`),
  create: (branchData: { name: string; address: string; phone: string }) =>
    apiClient.post('/branch', branchData),
  update: (id: number, branchData: Partial<{ name: string; address: string; phone: string }>) =>
    apiClient.patch(`/branch/${id}`, branchData),
  delete: (id: number) => apiClient.delete(`/branch/${id}`),
};