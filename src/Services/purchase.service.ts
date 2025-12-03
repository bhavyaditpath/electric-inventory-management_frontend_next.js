import { apiClient, ApiResponse } from "./api";
import { PurchaseDto, PurchaseResponseDto } from "../types/api-types";

export const purchaseApi = {
  recordPurchase: (data: PurchaseDto) =>
    apiClient.post<ApiResponse<PurchaseResponseDto>>('/purchase', data),

  getPurchases: () =>
    apiClient.get<ApiResponse<PurchaseResponseDto[]>>('/purchase'),

  getPurchase: (id: string) =>
    apiClient.get<ApiResponse<PurchaseResponseDto>>(`/purchase/${id}`),

  editRecordPurchase: (id: string, data: PurchaseDto) =>
    apiClient.patch<ApiResponse<PurchaseResponseDto>>(`/purchase/${id}`, data),

  removePurchase: (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(`/purchase/${id}`),
};
