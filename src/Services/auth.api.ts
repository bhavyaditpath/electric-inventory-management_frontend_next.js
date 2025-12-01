import { apiClient } from "./api";

// Auth API functions
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<{ access_token: string }>('/auth/login', credentials),

  register: (userData: { username: string; password: string; role: string; branchName: string }) =>
    apiClient.post('/auth/register', userData),
};
