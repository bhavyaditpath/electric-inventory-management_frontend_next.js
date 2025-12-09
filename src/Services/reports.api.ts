import { apiClient } from "./api";

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  // HALF_YEARLY = 'half-yearly',
  YEARLY = 'yearly',
}

export enum DeliveryMethod {
  EMAIL = 'email',
  LOCAL_FILE = 'local_file',
}

export interface CreateReportPreferenceDto {
  reportType: ReportType;
  deliveryMethod?: DeliveryMethod;
  isActive?: boolean;
}

export interface UpdateReportPreferenceDto {
  reportType?: ReportType;
  deliveryMethod?: DeliveryMethod;
  isActive?: boolean;
}

export const reportsApi = {
  getDailyReport: (userId?: number) =>
    apiClient.get(userId ? `/reports/daily?userId=${userId}` : '/reports/daily'),

  getWeeklyReport: (userId?: number) =>
    apiClient.get(userId ? `/reports/weekly?userId=${userId}` : '/reports/weekly'),

  getMonthlyReport: (userId?: number) =>
    apiClient.get(userId ? `/reports/monthly?userId=${userId}` : '/reports/monthly'),

  getHalfYearlyReport: (userId?: number) =>
    apiClient.get(userId ? `/reports/half-yearly?userId=${userId}` : '/reports/half-yearly'),

  getYearlyReport: (userId?: number) =>
    apiClient.get(userId ? `/reports/yearly?userId=${userId}` : '/reports/yearly'),

  createPreference: (createDto: CreateReportPreferenceDto) =>
    apiClient.post('/reports/preferences', createDto),

  getUserPreferences: () =>
    apiClient.get('/reports/preferences'),

  updatePreference: (id: number, updateDto: UpdateReportPreferenceDto) =>
    apiClient.put(`/reports/preferences/${id}`, updateDto),

  removePreference: (id: number) =>
    apiClient.delete(`/reports/preferences/${id}`),

  generateScheduledReports: () =>
    apiClient.post('/reports/generate-scheduled', {}),

  generateReport: (reportType: string, userId?: number) =>
    apiClient.post(userId ? `/reports/generate/${reportType}?userId=${userId}` : `/reports/generate/${reportType}`, {}),

  downloadReport: (filePath: string) => {
    // For downloading files, we'll use fetch directly to handle blob responses
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/reports/download?filePath=${encodeURIComponent(filePath)}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};