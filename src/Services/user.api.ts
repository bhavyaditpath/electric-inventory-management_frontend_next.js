import { apiClient } from "./api";
import { UserRole } from "@/types/enums";

export const userApi = {
    getAll: () => apiClient.get('/users'),
    getById: (id: number) => apiClient.get(`/users/${id}`),
    create: (userData: { username: string; password: string; role: UserRole; branchName: string }) =>
        apiClient.post('/users', userData),
    update: (id: number, userData: Partial<{ username: string; password: string; role: UserRole; branchName: string }>) =>
        apiClient.patch(`/users/${id}`, userData),
    delete: (id: number) => apiClient.delete(`/users/${id}`),
};