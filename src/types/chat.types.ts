// Chat Types

export interface User {
  id: string;
  username: string;
  profilePicture?: string;
  role: 'admin' | 'branch';
  branchId?: string;
  branchName?: string;
  isOnline?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomDto {
  name: string;
  type: 'direct' | 'group';
  participantIds: string[];
}

export interface SendMessageDto {
  roomId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedMessagesResponse {
  items: Message[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ChatRoomsResponse {
  rooms: ChatRoom[];
  total: number;
}

export interface SearchUsersResponse {
  users: User[];
  total: number;
}

// WebSocket Event Types
export interface WebSocketEvents {
  // Client to Server
  joinRoom: { roomId: string };
  leaveRoom: { roomId: string };
  sendMessage: { roomId: string; content: string; type?: 'text' | 'image' | 'file'; attachmentUrl?: string };
  typing: { roomId: string; isTyping: boolean };
  markAsRead: { roomId: string; messageIds: string[] };

  // Server to Client
  newMessage: Message;
  userOnline: { userId: string };
  userOffline: { userId: string };
  userTyping: { roomId: string; userId: string; isTyping: boolean };
  messageRead: { roomId: string; messageIds: string[]; readBy: string };
  roomUpdated: ChatRoom;
  userJoinedRoom: { roomId: string; user: User };
  userLeftRoom: { roomId: string; userId: string };
  error: { message: string; code: string };
}

export type WebSocketEventType = keyof WebSocketEvents;

// Chat State
export interface ChatState {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: { [roomId: string]: Message[] };
  onlineUsers: Set<string>;
  typingUsers: { [roomId: string]: Set<string> };
  loading: boolean;
  error: string | null;
  pagination: {
    [roomId: string]: {
      page: number;
      hasMore: boolean;
      loading: boolean;
    };
  };
}

// Chat Context
export interface ChatContextValue {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  loading: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file', attachmentUrl?: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  selectRoom: (roomId: string) => Promise<void>;
  createRoom: (name: string, participantIds: string[], type?: 'direct' | 'group') => Promise<ChatRoom | null>;
  startDirectChat: (userId: string) => Promise<ChatRoom | null>;
  searchUsers: (query: string) => Promise<User[]>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  refreshRooms: () => Promise<void>;
}
