import { apiClient } from "./api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'user' | 'branch';
  timestamp: string;
  read: boolean;
  userId?: string;
  branchId?: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationCount {
  unreadCount: number;
}

export const notificationApi = {
  // Get latest notifications (for dropdown)
  getLatest: (limit: number = 5) => {
    return apiClient.get<NotificationsResponse>(`/notifications/latest?limit=${limit}`);
  },

  // Get all notifications with pagination and filtering
  getAll: (type?: 'user' | 'branch', page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<NotificationsResponse>(`/notifications${query}`);
  },

  // Get unread notification count
  getUnreadCount: () => {
    return apiClient.get<NotificationCount>('/notifications/unread-count');
  },

  // Mark notification as read
  markAsRead: (id: string) => {
    return apiClient.patch<Notification>(`/notifications/${id}/read`, {});
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return apiClient.patch<{ success: boolean }>('/notifications/mark-all-read', {});
  },

  // Get notifications by user
  getByUser: (userId: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<NotificationsResponse>(`/notifications/user/${userId}${query}`);
  },

  // Get notifications by branch
  getByBranch: (branchId: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<NotificationsResponse>(`/notifications/branch/${branchId}${query}`);
  },
};