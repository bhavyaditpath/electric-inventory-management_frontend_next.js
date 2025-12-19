import { apiClient } from "./api";

// Auth API functions
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<{ access_token: string; refresh_token: string }>('/auth/login', credentials),

  register: (userData: { username: string; password: string; role: string; branchName: string }) =>
    apiClient.post('/auth/register', userData),

  forgotPassword: (data: { username: string }) =>
    apiClient.post("/auth/forgot-password", data),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post("/auth/reset-password", data),

  validateResetToken: (data: { token: string }) =>
    apiClient.post("/auth/validate-reset-token", data),

  googleCallback: (code: string) =>
    apiClient.post<{ access_token: string; refresh_token?: string }>('/auth/google/callback', { code }),

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ access_token: string; refresh_token?: string }>('/auth/refresh', { refresh_token: refreshToken }),

  getProfile: () =>
    apiClient.get<{
      id: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      profilePicture: string | null;
      role: string;
      branch: string | null;
      branchId: number;
    }>('/auth/me'),
};
