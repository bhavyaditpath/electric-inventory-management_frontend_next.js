import { apiClient } from "./api";
import { PurchaseDto } from "../types/api-types";

export const purchaseApi = {
    recordPurchase: (data: PurchaseDto) => apiClient.post('/purchase', data),
    getPurchases: () => apiClient.get('/purchase'),
    getPurchase: (id: string) => apiClient.get(`/purchase/${id}`),
    editRecordPurchase: (id: string, data: PurchaseDto) => apiClient.patch(`/purchase/${id}`, data),
    removePurchase: (id: string) => apiClient.delete(`/purchase/${id}`),
};