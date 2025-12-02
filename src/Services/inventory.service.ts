import { apiClient } from "./api";

export const inventoryApi = {
    getAll: () => apiClient.get('/inventory'),
};