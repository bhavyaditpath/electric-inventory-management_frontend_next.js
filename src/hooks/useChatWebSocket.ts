"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  ChatLanguage,
  ChatMessage,
  ChatMessageKind,
  ChatMessageNotification,
  ChatReactionNotification,
} from "@/types/chat.types";

const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface TypingPayload {
  userId: number;
  isTyping: boolean;
}

interface UserStatusPayload {
  userId: number;
}

interface RoomUpdatedPayload {
  id: number;
  name: string;
  isGroupChat: boolean;
}

interface UseChatWebSocketOptions {
  onMessage?: (message: ChatMessage) => void;
  onMessageUpdated?: (message: ChatMessage) => void;
  onMessageNotification?: (payload: ChatMessageNotification) => void;
  onMessageDeleted?: (payload: { id: number; chatRoomId: number }) => void;
  onMessageReactionUpdated?: (message: ChatMessage) => void;
  onReactionNotification?: (payload: ChatReactionNotification) => void;
  onRoomUpdated?: (payload: RoomUpdatedPayload) => void;
  onTyping?: (payload: TypingPayload) => void;
  onUserOnline?: (userId: number) => void;
  onUserOffline?: (userId: number) => void;
}

export const useChatWebSocket = (options: UseChatWebSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(options);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    handlersRef.current = options;
  }, [options]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${SOCKET_BASE_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("newMessage", (message: ChatMessage) => {
      handlersRef.current.onMessage?.(message);
    });
    socket.on("messageUpdated", (message: ChatMessage) => {
      handlersRef.current.onMessageUpdated?.(message);
    });
    socket.on("messageNotification", (payload: ChatMessageNotification) => {
      handlersRef.current.onMessageNotification?.(payload);
    });
    socket.on("messageDeleted", (payload: { id: number; chatRoomId: number }) => {
      handlersRef.current.onMessageDeleted?.(payload);
    });
    socket.on("messageReactionUpdated", (message: ChatMessage) => {
      handlersRef.current.onMessageReactionUpdated?.(message);
    });
    socket.on("reactionNotification", (payload: ChatReactionNotification) => {
      handlersRef.current.onReactionNotification?.(payload);
    });
    socket.on("roomUpdated", (payload: RoomUpdatedPayload) => {
      handlersRef.current.onRoomUpdated?.(payload);
    });
    socket.on("userTyping", (payload: TypingPayload) => {
      handlersRef.current.onTyping?.(payload);
    });
    socket.on("userOnline", (payload: UserStatusPayload) => {
      handlersRef.current.onUserOnline?.(payload.userId);
    });
    socket.on("userOffline", (payload: UserStatusPayload) => {
      handlersRef.current.onUserOffline?.(payload.userId);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: number) => {
    socketRef.current?.emit("joinRoom", { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: number) => {
    socketRef.current?.emit("leaveRoom", { roomId });
  }, []);

  const sendMessage = useCallback(
    (
      roomId: number,
      content: string,
      kind?: ChatMessageKind,
      language?: ChatLanguage
    ) => {
      socketRef.current?.emit("sendMessage", {
        roomId,
        content,
        ...(kind ? { kind } : {}),
        ...(language ? { language } : {}),
      });
    },
    []
  );

  const sendTyping = useCallback((roomId: number, isTyping: boolean) => {
    socketRef.current?.emit("typing", { roomId, isTyping });
  }, []);

  const markAsRead = useCallback((roomId: number) => {
    socketRef.current?.emit("markAsRead", { roomId });
  }, []);

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    markAsRead,
  };
};
