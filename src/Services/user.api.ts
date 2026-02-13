import { apiClient } from "./api";
import { UserRole } from "@/types/enums";

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const userApi = {
    getAll: (params?: PaginationParams) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder.toUpperCase());

        const queryString = searchParams.toString();
        return apiClient.get(`/users${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id: number) => apiClient.get(`/users/${id}`),
    create: (userData: { username: string; password: string; role: UserRole; branchName: string }) =>
        apiClient.post('/users', userData),
    update: (id: number, userData: Partial<{ username: string; password: string; role: UserRole; branchName: string }>) =>
        apiClient.patch(`/users/${id}`, userData),
    delete: (id: number) => apiClient.delete(`/users/${id}`),
    getAllBranches: () => apiClient.get('/users/branch-names'),
};