import { apiClient } from "./api";

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const requestApi = {
    createRequest: (data: any) => apiClient.post('/request', data),
    getRequests: (params?: PaginationParams) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder.toUpperCase());

        const queryString = searchParams.toString();
        return apiClient.get(`/request${queryString ? `?${queryString}` : ''}`);
    },
    getAdminsForDropdown: (params?: { productName?: string; brand?: string }) => {
        let endpoint = '/request/admins';
        if (params) {
            const searchParams = new URLSearchParams();
            if (params.productName) searchParams.append('productName', params.productName);
            const query = searchParams.toString();
            if (query) endpoint += '?' + query;
        }
        return apiClient.get(endpoint);
    },
    updateRequestStatus: (id: number, status: string) => apiClient.patch(`/request/${id}`, { status }),
};