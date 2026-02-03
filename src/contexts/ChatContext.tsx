'use client';

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { chatApiHelpers, normalizeMessage, normalizeRoom } from '../Services/chat.api';
import {
  ChatRoom,
  Message,
  User,
  ChatContextValue,
  PaginationParams,
} from '../types/chat.types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface ChatProviderProps {
  children: React.ReactNode;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesPaginationRef = useRef<PaginationParams>({ page: 1, pageSize: 50 });

  // WebSocket connection
  const currentUserId = user?.id?.toString() || '';
  const {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage: wsSendMessage,
    setTyping,
    markAsRead: wsMarkAsRead,
    onlineUsers,
    typingUsers,
  } = useChatWebSocket({
    enabled: !!user,
    onNewMessage: (message) => {
      const rawMessage = message as any;
      const normalizedMessage = normalizeMessage(
        message,
        rawMessage?.roomId ?? rawMessage?.chatRoomId
      );
      if (normalizedMessage.roomId === activeRoom?.id) {
        setMessages((prev) => [...prev, normalizedMessage]);
        // Mark as read if it's not our own message
        if (normalizedMessage.senderId !== currentUserId) {
          markAsRead([normalizedMessage.id]);
        }
      }
      // Update rooms with new last message
      setRooms((prev) =>
        prev.map((room) =>
          room.id === normalizedMessage.roomId
            ? { ...room, lastMessage: normalizedMessage, unreadCount: room.id === activeRoom?.id ? 0 : room.unreadCount + 1 }
            : room
        )
      );
    },
    onUserOnline: (userId) => {
      // Update user online status
    },
    onUserOffline: (userId) => {
      // Update user offline status
    },
    onUserTyping: (roomId, typingUserId, isTyping) => {
      // Handle typing indicator
    },
    onMessageRead: (roomId, messageIds, readBy) => {
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, isRead: true, readBy: [...msg.readBy, readBy] } : msg
        )
      );
    },
    onError: (message) => {
      // Only show error for non-connection errors
      if (!message.includes('connection') && !message.includes('WebSocket')) {
        toast.error(message);
        setError(message);
      } else {
        // Connection errors are expected when server is unavailable
        console.warn('WebSocket connection issue:', message);
      }
    },
  });

  // Load rooms on mount
  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  // Join active room
  useEffect(() => {
    if (activeRoom) {
      joinRoom(activeRoom.id);
      return () => leaveRoom(activeRoom.id);
    }
  }, [activeRoom, joinRoom, leaveRoom]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await chatApiHelpers.getRooms();
      setRooms(roomsData);
    } catch (err) {
      setError('Failed to load chat rooms');
      toast.error('Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeRoom) return;

    try {
      setLoading(true);
      messagesPaginationRef.current = { page: 1, pageSize: 50 };
      const response = await chatApiHelpers.getMessages(activeRoom.id, 1, 50);
      // Ensure items is an array
      const items = Array.isArray(response?.items) ? response.items : [];
      setMessages(items);
      setHasMoreMessages(response?.hasMore ?? false);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!activeRoom || !hasMoreMessages) return;

    try {
      const nextPage = messagesPaginationRef.current.page + 1;
      const response = await chatApiHelpers.getMessages(activeRoom.id, nextPage, 50);
      // Ensure items is an array before spreading
      const items = Array.isArray(response?.items) ? response.items : [];
      setMessages((prev) => [...items, ...prev]);
      messagesPaginationRef.current = { ...messagesPaginationRef.current, page: nextPage };
      setHasMoreMessages(response?.hasMore ?? false);
    } catch (err) {
      console.error('Failed to load more messages:', err);
      setError('Failed to load more messages');
    }
  };

  const selectRoom = async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setActiveRoom(room);
      await loadMessages();
    }
  };

  const sendMessage = async (
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    attachmentUrl?: string
  ) => {
    if (!activeRoom || !content.trim()) return;

    try {
      // Send via WebSocket for real-time
      wsSendMessage(activeRoom.id, content, type, attachmentUrl);
    } catch (err) {
      setError('Failed to send message');
      toast.error('Failed to send message');
    }
  };

  const createRoom = async (
    name: string,
    participantIds: string[],
    type: 'direct' | 'group' = 'group'
  ) => {
    try {
      setLoading(true);
      const response = await import('../Services/chat.api').then((m) =>
        m.chatApi.createRoom({ name, type, participantIds })
      );
      if (response.success && response.data) {
        const normalizedRoom = normalizeRoom(response.data);
        setRooms((prev) => [normalizedRoom, ...prev]);
        setActiveRoom(normalizedRoom);
        await loadMessages();
        toast.success('Room created successfully');
        return normalizedRoom;
      }
    } catch (err) {
      setError('Failed to create room');
      toast.error('Failed to create room');
    } finally {
      setLoading(false);
    }
    return null;
  };

  const startDirectChat = async (userId: string) => {
    try {
      setLoading(true);
      const room = await chatApiHelpers.createDirectChat(userId);
      if (room) {
        setRooms((prev) => {
          const exists = prev.find((r) => r.id === room.id);
          if (exists) return prev;
          return [room, ...prev];
        });
        setActiveRoom(room);
        await loadMessages();
        return room;
      }
    } catch (err) {
      setError('Failed to start direct chat');
      toast.error('Failed to start direct chat');
    } finally {
      setLoading(false);
    }
    return null;
  };

  const searchUsers = async (query: string) => {
    try {
      return await chatApiHelpers.searchUsers(query);
    } catch (err) {
      setError('Failed to search users');
      return [];
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    if (!activeRoom) return;

    try {
      await chatApiHelpers.markAsRead(activeRoom.id);
      wsMarkAsRead(activeRoom.id, messageIds);
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      setError('Failed to mark messages as read');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (activeRoom) {
      setTyping(activeRoom.id, isTyping);
    }
  };

  const refreshRooms = async () => {
    await loadRooms();
  };

  const value: ChatContextValue = {
    rooms,
    activeRoom,
    messages,
    onlineUsers,
    typingUsers: new Set(
      activeRoom ? typingUsers[activeRoom.id] || [] : []
    ),
    loading,
    error,
    hasMoreMessages,
    sendMessage,
    loadMessages,
    loadMoreMessages,
    selectRoom,
    createRoom,
    startDirectChat,
    searchUsers,
    markAsRead,
    setTyping: handleTyping,
    refreshRooms,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
