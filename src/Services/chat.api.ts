import { apiClient } from "./api";
import {
  ChatLanguage,
  ChatMessage,
  ChatMessageKind,
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
  kind?: ChatMessageKind;
  language?: ChatLanguage;
  replyToMessageId?: number;
}

export interface AddParticipantsPayload {
  participantIds: number[];
}

export interface PinRoomPayload {
  pinned: boolean;
}

export interface UpdateRoomNamePayload {
  name: string;
}

export interface RemoveParticipantPayload {
  userId?: number;
  newAdminId?: number;
}

export interface EditMessagePayload {
  content?: string;
  kind?: ChatMessageKind;
  language?: ChatLanguage;
}

export interface ForwardMessagePayload {
  sourceMessageId: number;
  targetRoomIds: number[];
  note?: string;
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

  removeParticipant: (roomId: number, payload: RemoveParticipantPayload) =>
    apiClient.post<null>(`/chat/rooms/${roomId}/participants/remove`, payload),

  pinRoom: (roomId: number, payload: PinRoomPayload) =>
    apiClient.post<{ pinned: boolean }>(`/chat/rooms/${roomId}/pin`, payload),

  updateRoomName: (roomId: number, payload: UpdateRoomNamePayload) =>
    apiClient.patch<{ id: number; name: string }>(
      `/chat/rooms/${roomId}/name`,
      payload
    ),

  sendMessage: (payload: SendMessagePayload, files?: File[]) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("chatRoomId", String(payload.chatRoomId));
      if (payload.content) {
        formData.append("content", payload.content);
      }
      if (payload.kind) {
        formData.append("kind", payload.kind);
      }
      if (payload.language) {
        formData.append("language", payload.language);
      }
      if (typeof payload.replyToMessageId === "number") {
        formData.append("replyToMessageId", String(payload.replyToMessageId));
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

  deleteMessage: (messageId: number) =>
    apiClient.delete<null>(`/chat/messages/${messageId}`),

  editMessage: (messageId: number, payload: EditMessagePayload) =>
    apiClient.patch<ChatMessage>(`/chat/messages/${messageId}`, payload),

  forwardMessage: (payload: ForwardMessagePayload) =>
    apiClient.post<ChatMessage[]>("/chat/messages/forward", payload),

  toggleMessageReaction: (messageId: number, emoji: string) =>
    apiClient.post<ChatMessage>(`/chat/messages/${messageId}/reactions`, {
      emoji,
    }),

  getMessageDeliveryStatus: (messageId: number) =>
    apiClient.get<Array<{
      userId: number;
      username: string;
      status: string;
      deliveredAt?: string | null;
      readAt?: string | null;
    }>>(`/chat/messages/${messageId}/delivery-status`),

  deleteRoom: (roomId: number) =>
    apiClient.delete<null>(`/chat/rooms/${roomId}`),

  downloadAttachment: async (attachmentId: number) => {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");

    const response = await fetch(
      `${API_BASE_URL}/chat/attachments/${attachmentId}/download`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Download failed with status ${response.status}`
      );
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)"/i);
    const filename = filenameMatch
      ? decodeURIComponent(filenameMatch[1])
      : null;

    return { blob, filename };
  },
};
