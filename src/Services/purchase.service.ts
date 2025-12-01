import { apiClient } from "./api";
import { CreatePurchaseDto, PurchaseResponseDto } from "../types/api-types";

export const recordPurchase = async (
  data: CreatePurchaseDto
): Promise<PurchaseResponseDto> => {
  const response = await apiClient.post<PurchaseResponseDto>('/purchase', data);
  return response.data!;
};

export const getPurchases = async (): Promise<PurchaseResponseDto[]> => {
  const response = await apiClient.get<PurchaseResponseDto[]>('/purchase');
  return response.data!;
};

// export const purchaseApi = {
//     recordPurchase: (data: CreatePurchaseDto) => apiClient.post('/purchase', data),
//     getPurchases: () => apiClient.get('/purchase'),
// };