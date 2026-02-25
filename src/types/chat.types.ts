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
  pinned?: boolean;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  sender?: ChatUser;
  attachments?: ChatAttachment[];
  reactions?: ChatReaction[];
  isRead?: boolean;
  readAt?: string | null;
}

export interface ChatReaction {
  emoji: string;
  count?: number;
  reactedByMe?: boolean;
  userIds?: number[];
}

export interface ChatReactionNotification {
  messageId: number;
  chatRoomId: number;
  emoji: string;
  reactorId: number;
  reactorName: string;
  action: "added" | "removed";
  createdAt: string;
}

export interface ChatMessageNotification {
  messageId: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  content?: string;
  createdAt: string;
}

export interface ChatAttachment {
  id: number;
  url: string;
  mimeType: string;
  fileName: string;
  size: number;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
