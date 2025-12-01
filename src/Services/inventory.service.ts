import { apiClient } from "./api";

export const purchaseApi = {
    getAll: () => apiClient.get('/inventory'),
    getProductNames: () => apiClient.get('/inventory/product-names'),
};