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

export type ChatMessageKind = "text" | "code" | "html" | "json" | "markdown";

export type ChatLanguage =
  | "plaintext"
  | "javascript"
  | "typescript"
  | "json"
  | "html"
  | "css"
  | "sql"
  | "bash"
  | "python"
  | "java"
  | "csharp"
  | "cpp";

export interface ChatReplyPreview {
  id: number;
  senderId: number;
  senderName?: string;
  content?: string;
  kind?: ChatMessageKind;
  language?: ChatLanguage;
  createdAt: string;
  isRemoved?: boolean;
}

export interface ChatForwardedPreview {
  messageId?: number | null;
  senderId?: number | null;
  senderName?: string;
  createdAt?: string | null;
  contentPreview?: string;
  kind?: ChatMessageKind;
  language?: ChatLanguage;
  isRemoved?: boolean;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  replyToMessageId?: number | null;
  isForwarded?: boolean;
  forwardedFromMessageId?: number | null;
  content: string;
  kind?: ChatMessageKind;
  language?: ChatLanguage;
  createdAt: string;
  updatedAt?: string;
  replyTo?: ChatReplyPreview | null;
  forwardedFrom?: ChatForwardedPreview | null;
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
  kind?: ChatMessageKind;
  language?: ChatLanguage;
  replyTo?: ChatReplyPreview | null;
  isForwarded?: boolean;
  forwardedFrom?: ChatForwardedPreview | null;
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
