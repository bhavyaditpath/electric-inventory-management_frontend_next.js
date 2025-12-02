import { apiClient } from "./api";

export const requestApi = {
    createRequest: (data: any) => apiClient.post('/request', data),
    getRequests: () => apiClient.get('/request'),
    getAdminsForDropdown: () => apiClient.get('/request/admins'),
    updateRequestStatus: (id: number, status: string) => apiClient.patch(`/request/${id}`, { status }),
};