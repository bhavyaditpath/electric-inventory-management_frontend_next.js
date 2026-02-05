import { apiClient } from "./api";
import {
  ChatMessage,
  ChatMessagesResponse,
  ChatRoom,
  ChatUser,
} from "@/types/chat.types";

export interface CreateChatRoomPayload {
  name?: string;
  isGroupChat: boolean;
  participantIds: number[];
}

export interface SendMessagePayload {
  chatRoomId: number;
  content?: string;
}

export interface AddParticipantsPayload {
  participantIds: number[];
}

export const chatApi = {
  createRoom: (payload: CreateChatRoomPayload) =>
    apiClient.post<ChatRoom>("/chat/rooms", payload),

  getRooms: () => apiClient.get<ChatRoom[]>("/chat/rooms"),

  getRoom: (roomId: number) =>
    apiClient.get<ChatRoom>(`/chat/rooms/${roomId}`),

  getOrCreateDirectChat: (userId: number) =>
    apiClient.post<ChatRoom>(`/chat/rooms/direct/${userId}`, {}),

  getUsers: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<ChatUser[]>(`/chat/users${query}`);
  },

  getUsersWithOnlineStatus: () =>
    apiClient.get<ChatUser[]>("/chat/users/online-status"),

  addParticipants: (roomId: number, payload: AddParticipantsPayload) =>
    apiClient.post<ChatRoom>(`/chat/rooms/${roomId}/participants`, payload),

  sendMessage: (payload: SendMessagePayload, files?: File[]) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("chatRoomId", String(payload.chatRoomId));
      if (payload.content) {
        formData.append("content", payload.content);
      }
      files.forEach((file) => formData.append("files", file));
      return apiClient.postForm<ChatMessage>("/chat/messages", formData);
    }
    return apiClient.post<ChatMessage>("/chat/messages", payload);
  },

  getMessages: (roomId: number, page: number = 1, limit: number = 50) =>
    apiClient.get<ChatMessagesResponse>(
      `/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`
    ),

  markAsRead: (roomId: number) =>
    apiClient.post<null>(`/chat/rooms/${roomId}/read`, {}),
};
