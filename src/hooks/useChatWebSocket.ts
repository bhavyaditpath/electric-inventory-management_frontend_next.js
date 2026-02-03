'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { Message, ChatRoom, User } from '../types/chat.types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UseChatWebSocketOptions {
  enabled?: boolean;
  onNewMessage?: (message: Message) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onUserTyping?: (roomId: string, userId: string, isTyping: boolean) => void;
  onMessageRead?: (roomId: string, messageIds: string[], readBy: string) => void;
  onRoomUpdated?: (room: ChatRoom) => void;
  onError?: (message: string) => void;
}

interface UseChatWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string, type?: string, attachmentUrl?: string) => void;
  setTyping: (roomId: string, isTyping: boolean) => void;
  markAsRead: (roomId: string, messageIds: string[]) => void;
  onlineUsers: Set<string>;
  typingUsers: { [roomId: string]: Set<string> };
}

export function useChatWebSocket(options: UseChatWebSocketOptions = {}): UseChatWebSocketReturn {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<UseChatWebSocketOptions>({});
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<{ [roomId: string]: Set<string> }>({});
  
  const {
    enabled = true,
    onNewMessage,
    onUserOnline,
    onUserOffline,
    onUserTyping,
    onMessageRead,
    onRoomUpdated,
    onError,
  } = options;

  useEffect(() => {
    handlersRef.current = {
      onNewMessage,
      onUserOnline,
      onUserOffline,
      onUserTyping,
      onMessageRead,
      onRoomUpdated,
      onError,
    };
  }, [onNewMessage, onUserOnline, onUserOffline, onUserTyping, onMessageRead, onRoomUpdated, onError]);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !user) return;

    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return;

    // Create socket connection with error handling
    try {
      socketRef.current = io(`${SOCKET_URL}/chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000,
      });
    } catch (error) {
      console.warn('Failed to create WebSocket connection');
      return;
    }

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Chat WebSocket connected');
    });

    socket.on('disconnect', (reason: string) => {
      setIsConnected(false);
      console.warn('Chat WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
      console.warn('Chat WebSocket connection failed - server may be unavailable');
      setIsConnected(false);
      // Don't throw error, just log warning
    });

    // Message events
    socket.on('newMessage', (message: Message) => {
      handlersRef.current.onNewMessage?.(message);
    });

    // User status events
    socket.on('userOnline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
      handlersRef.current.onUserOnline?.(userId);
    });

    socket.on('userOffline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      handlersRef.current.onUserOffline?.(userId);
    });

    // Typing events
    socket.on('userTyping', ({ roomId, userId, isTyping }: { roomId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newTyping = { ...prev };
        if (!newTyping[roomId]) {
          newTyping[roomId] = new Set();
        }
        if (isTyping) {
          newTyping[roomId].add(userId);
        } else {
          newTyping[roomId].delete(userId);
        }
        return { ...newTyping };
      });
      handlersRef.current.onUserTyping?.(roomId, userId, isTyping);
    });

    // Message read events
    socket.on('messageRead', ({ roomId, messageIds, readBy }: { roomId: string; messageIds: string[]; readBy: string }) => {
      handlersRef.current.onMessageRead?.(roomId, messageIds, readBy);
    });

    // Room events
    socket.on('roomUpdated', (room: ChatRoom) => {
      handlersRef.current.onRoomUpdated?.(room);
    });

    // Error events
    socket.on('error', ({ message }: { message: string; code: string }) => {
      handlersRef.current.onError?.(message);
    });

    // Cleanup
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, enabled]);

  // Join room
  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinRoom', { roomId });
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leaveRoom', { roomId });
    }
  }, []);

  // Send message
  const sendMessage = useCallback((roomId: string, content: string, type?: string, attachmentUrl?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', {
        roomId,
        content,
        type: type || 'text',
        attachmentUrl,
      });
    }
  }, []);

  // Set typing status
  const setTyping = useCallback((roomId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { roomId, isTyping });
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((roomId: string, messageIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('markAsRead', { roomId, messageIds });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    setTyping,
    markAsRead,
    onlineUsers,
    typingUsers,
  };
}
