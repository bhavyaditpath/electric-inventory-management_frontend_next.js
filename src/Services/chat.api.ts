import { apiClient, ApiResponse } from './api';
import {
  ChatRoom,
  Message,
  CreateRoomDto,
  SendMessageDto,
  PaginationParams,
  PaginatedMessagesResponse,
  ChatRoomsResponse,
  SearchUsersResponse,
  User,
} from '../types/chat.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ChatApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Room endpoints
  async createRoom(data: CreateRoomDto): Promise<ApiResponse<ChatRoom>> {
    return apiClient.post<ChatRoom>('/chat/rooms', data);
  }

  async getRooms(): Promise<ApiResponse<ChatRoomsResponse>> {
    return apiClient.get<ChatRoomsResponse>('/chat/rooms');
  }

  async getRoom(roomId: string): Promise<ApiResponse<ChatRoom>> {
    return apiClient.get<ChatRoom>(`/chat/rooms/${roomId}`);
  }

  async getOrCreateDirectChat(userId: string): Promise<ApiResponse<ChatRoom>> {
    return apiClient.post<ChatRoom>(`/chat/rooms/direct/${userId}`, {});
  }

  // Message endpoints
  async sendMessage(data: SendMessageDto): Promise<ApiResponse<Message>> {
    return apiClient.post<Message>('/chat/messages', data);
  }

  async getMessages(
    roomId: string,
    params: PaginationParams
  ): Promise<ApiResponse<PaginatedMessagesResponse>> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    });
    return apiClient.get<PaginatedMessagesResponse>(
      `/chat/rooms/${roomId}/messages?${queryParams}`
    );
  }

  async markMessagesAsRead(roomId: string, messageIds: string[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/chat/rooms/${roomId}/read`, { messageIds });
  }

  // User search
  async searchUsers(query: string): Promise<ApiResponse<SearchUsersResponse>> {
    return apiClient.get<SearchUsersResponse>(`/chat/users?search=${encodeURIComponent(query)}`);
  }
}

export const chatApi = new ChatApiService(API_BASE_URL);

// Helper functions for common operations
export const chatApiHelpers = {
  async getRooms(): Promise<ChatRoom[]> {
    const response = await chatApi.getRooms();
    return response.success && response.data ? response.data.rooms : [];
  },

  async getMessages(roomId: string, page = 1, pageSize = 50): Promise<PaginatedMessagesResponse> {
    const response = await chatApi.getMessages(roomId, { page, pageSize });
    if (response.success && response.data) {
      return response.data;
    }
    return { items: [], total: 0, page: 1, pageSize, totalPages: 0, hasMore: false };
  },

  async sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text', attachmentUrl?: string): Promise<Message | null> {
    const response = await chatApi.sendMessage({ roomId, content, type, attachmentUrl });
    return response.success && response.data ? response.data : null;
  },

  async createDirectChat(userId: string): Promise<ChatRoom | null> {
    const response = await chatApi.getOrCreateDirectChat(userId);
    return response.success && response.data ? response.data : null;
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await chatApi.searchUsers(query);
    return response.success && response.data ? response.data.users : [];
  },

  async markAsRead(roomId: string, messageIds: string[]): Promise<boolean> {
    const response = await chatApi.markMessagesAsRead(roomId, messageIds);
    return response.success;
  },
};
