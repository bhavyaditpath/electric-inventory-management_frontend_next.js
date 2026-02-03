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
      limit: params.pageSize.toString(),
    });
    return apiClient.get<PaginatedMessagesResponse>(
      `/chat/rooms/${roomId}/messages?${queryParams}`
    );
  }

  async markMessagesAsRead(roomId: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/chat/rooms/${roomId}/read`, {});
  }

  // User search
  async searchUsers(query: string): Promise<ApiResponse<SearchUsersResponse>> {
    return apiClient.get<SearchUsersResponse>(`/chat/users?search=${encodeURIComponent(query)}`);
  }
}

export const chatApi = new ChatApiService(API_BASE_URL);

const normalizeId = (id: unknown): string => {
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return id.toString();
  return '';
};

const normalizeRole = (role: unknown): 'admin' | 'branch' => {
  if (typeof role === 'string') {
    const lower = role.toLowerCase();
    if (lower.includes('branch')) return 'branch';
  }
  return 'admin';
};

export const normalizeUser = (raw: any): User => {
  const username = raw?.username ?? raw?.email ?? 'Unknown';
  return {
    id: normalizeId(raw?.id),
    username,
    profilePicture: raw?.profilePicture ?? undefined,
    role: normalizeRole(raw?.role),
    branchId: raw?.branchId ? normalizeId(raw.branchId) : undefined,
    branchName: raw?.branch?.name ?? undefined,
    isOnline: raw?.isOnline ?? false,
  };
};

export const normalizeMessage = (raw: any, roomIdFallback?: string): Message => {
  return {
    id: normalizeId(raw?.id),
    roomId: normalizeId(raw?.roomId ?? raw?.chatRoomId ?? roomIdFallback),
    senderId: normalizeId(raw?.senderId),
    sender: raw?.sender ? normalizeUser(raw.sender) : normalizeUser(raw?.createdByUser),
    content: raw?.content ?? '',
    type: raw?.type ?? 'text',
    attachmentUrl: raw?.attachmentUrl ?? undefined,
    attachmentName: raw?.attachmentName ?? undefined,
    isRead: raw?.isRead ?? false,
    readBy: Array.isArray(raw?.readBy) ? raw.readBy : [],
    createdAt: raw?.createdAt ?? new Date(0).toISOString(),
    updatedAt: raw?.updatedAt ?? raw?.createdAt ?? new Date(0).toISOString(),
  };
};

export const normalizeRoom = (raw: any): ChatRoom => {
  const roomId = normalizeId(raw?.id);
  const isGroup =
    typeof raw?.isGroupChat === 'boolean' ? raw.isGroupChat : raw?.type === 'group';
  const participants: User[] = Array.isArray(raw?.participants)
    ? raw.participants.map(normalizeUser)
    : [];

  if (participants.length === 0 && raw?.createdByUser) {
    participants.push(normalizeUser(raw.createdByUser));
  }

  if (raw?.lastMessage?.sender) {
    const sender = normalizeUser(raw.lastMessage.sender);
    if (!participants.some((p) => p.id === sender.id)) {
      participants.push(sender);
    }
  }

  return {
    id: roomId,
    name: raw?.name ?? 'Chat',
    type: isGroup ? 'group' : 'direct',
    participants,
    lastMessage: raw?.lastMessage ? normalizeMessage(raw.lastMessage, roomId) : undefined,
    unreadCount: raw?.unreadCount ?? 0,
    createdAt: raw?.createdAt ?? new Date(0).toISOString(),
    updatedAt: raw?.updatedAt ?? raw?.createdAt ?? new Date(0).toISOString(),
    createdBy: raw?.createdBy ? normalizeId(raw.createdBy) : normalizeId(raw?.createdByUser?.id),
  };
};

// Helper functions for common operations
export const chatApiHelpers = {
  async getRooms(): Promise<ChatRoom[]> {
    const response = await chatApi.getRooms();
    if (!response.success || !response.data) return [];

    const roomsPayload = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response.data as ChatRoomsResponse).rooms)
        ? (response.data as ChatRoomsResponse).rooms
        : [];

    return roomsPayload.map(normalizeRoom);
  },

  async getMessages(roomId: string, page = 1, pageSize = 50): Promise<PaginatedMessagesResponse> {
    try {
      const response = await chatApi.getMessages(roomId, { page, pageSize });
      if (response.success && response.data) {
        const rawItems = Array.isArray((response.data as any).items)
          ? (response.data as any).items
          : Array.isArray((response.data as any).messages)
            ? (response.data as any).messages
            : Array.isArray(response.data)
              ? response.data
              : [];
        const items = rawItems.map((item: any) => normalizeMessage(item, roomId));
        const total = (response.data as any).total ?? items.length;
        const limit = (response.data as any).limit ?? pageSize;
        const totalPages = (response.data as any).totalPages ?? Math.ceil(total / limit);
        const hasMore = (response.data as any).page
          ? (response.data as any).page < totalPages
          : page < totalPages;
        return {
          items,
          total,
          page: (response.data as any).page ?? page,
          pageSize: (response.data as any).pageSize ?? limit,
          totalPages,
          hasMore,
        };
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    return { items: [], total: 0, page: 1, pageSize, totalPages: 0, hasMore: false };
  },

  async sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text', attachmentUrl?: string): Promise<Message | null> {
    const response = await chatApi.sendMessage({ roomId, content, type, attachmentUrl });
    return response.success && response.data ? normalizeMessage(response.data, roomId) : null;
  },

  async createDirectChat(userId: string): Promise<ChatRoom | null> {
    const response = await chatApi.getOrCreateDirectChat(userId);
    return response.success && response.data ? normalizeRoom(response.data) : null;
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await chatApi.searchUsers(query);
    if (!response.success || !response.data) return [];
    const users = Array.isArray(response.data.users) ? response.data.users : [];
    return users.map(normalizeUser);
  },

  async markAsRead(roomId: string, _messageIds?: string[]): Promise<boolean> {
    const response = await chatApi.markMessagesAsRead(roomId);
    return response.success;
  },
};
