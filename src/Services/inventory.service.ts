import { apiClient } from "./api";
import { PurchaseDto } from "../types/api-types";

export const inventoryApi = {
    getAll: () => apiClient.get('/inventory'),
};