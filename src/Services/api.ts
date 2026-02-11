const API_BASE_URL = "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const config: RequestInit = {
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('access_token') ;
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      let response = await fetch(url, config);

      if (response.status === 401) {
        if (localStorage.getItem('refresh_token')) {
          const refreshResponse = await this.refreshAccessToken();

          if (refreshResponse.success && refreshResponse.data?.access_token) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${refreshResponse.data.access_token}`,
            };

            response = await fetch(url, config);
          }
        } else if (token) {
          // If we had a token (authenticated request) but got 401 and have no refresh token,
          // it means our session is dead and we can't recover.
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:session-expired'));
          }
        }
      }

      try {
        return await response.json();
      } catch {
        if (response.ok) {
          return { success: true, message: 'Operation completed successfully' };
        }
        throw new Error(`API request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<ApiResponse<{ access_token: string; refresh_token?: string }>> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return { success: false, message: 'No refresh token available' };
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Handle non-JSON response for refresh token
        if (response.ok) {
          return { success: true, message: 'Token refresh completed' };
        } else {
          throw new Error(`Token refresh failed with status ${response.status}`);
        }
      }

      if (data.success && data.data?.access_token) {
        localStorage.setItem('access_token', data.data.access_token);
        if (data.data.refresh_token) {
          localStorage.setItem('refresh_token', data.data.refresh_token);
        }
      }

      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');

      // Notify UI to purge session state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:session-expired'));
      }
      return { success: false, message: 'Token refresh failed' };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postForm<T>(endpoint: string, data: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data,
    });
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
