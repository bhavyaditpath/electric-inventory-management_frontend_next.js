import { apiClient } from "./api";
import { PurchaseDto } from "../types/api-types";

export const inventoryApi = {
    getAll: () => apiClient.get('/inventory'),
    getProductNames: () => apiClient.get('/inventory/product-names'),
    editInventory: (id: string, data: Partial<PurchaseDto>) => apiClient.patch(`/inventory/${id}`, data),
    removeInventory: (id: string) => apiClient.delete(`/inventory/${id}`),
};