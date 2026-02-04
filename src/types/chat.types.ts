export interface ChatUser {
  id: number;
  username: string;
  branch?: string | null;
  role: string;
  isOnline?: boolean;
}

export interface ChatRoomParticipant {
  userId: number;
  user?: ChatUser;
}

export interface ChatRoom {
  id: number;
  name: string;
  isGroupChat: boolean;
  createdBy: number;
  createdByUser?: ChatUser;
  participants?: ChatRoomParticipant[];
  updatedAt?: string;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender?: ChatUser;
  isRead?: boolean;
  readAt?: string | null;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
