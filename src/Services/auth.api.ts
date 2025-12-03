import { apiClient } from "./api";

// Auth API functions
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<{ access_token: string }>('/auth/login', credentials),

  register: (userData: { username: string; password: string; role: string; branchName: string }) =>
    apiClient.post('/auth/register', userData),

  forgotPassword: (data: { username: string }) =>
    apiClient.post("/auth/forgot-password", data),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post("/auth/reset-password", data),

  googleCallback: (code: string) =>
    apiClient.post<{ access_token: string; refresh_token?: string }>('/auth/google/callback', { code }),
};
