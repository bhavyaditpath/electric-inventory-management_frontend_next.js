import { apiClient } from "./api";

export const requestApi = {
    createRequest: (data: any) => apiClient.post('/request', data),
    getRequests: () => apiClient.get('/request'),
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