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
import { isEncryptedMessage } from "@/utils/chatEncryption";

const SOCKET_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

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

interface MessagesDeliveredPayload {
  roomId: number;
  userId: number;
  deliveredAt: string;
}

interface MessagesReadPayload {
  roomId: number;
  userId: number;
  readAt: string;
}

interface UseChatWebSocketOptions {
  onMessage?: (message: ChatMessage) => void;
  onMessageUpdated?: (message: ChatMessage) => void;
  onMessagesDelivered?: (payload: MessagesDeliveredPayload) => void;
  onMessagesRead?: (payload: MessagesReadPayload) => void;
  onMessageNotification?: (payload: ChatMessageNotification) => void;
  onMessageDeleted?: (payload: { id: number; chatRoomId: number }) => void;
  onMessageReactionUpdated?: (message: ChatMessage) => void;
  onReactionNotification?: (payload: ChatReactionNotification) => void;
  onRoomUpdated?: (payload: RoomUpdatedPayload) => void;
  onTyping?: (payload: TypingPayload) => void;
  onUserOnline?: (userId: number) => void;
  onUserOffline?: (userId: number) => void;
  onMessagePinned?: (payload: { messageId: number; pinned: boolean; message: ChatMessage }) => void;
  encryptMessage?: (plaintext: string, roomId: number) => Promise<string>;
  decryptMessage?: (encryptedContent: string, roomId: number) => Promise<string>;
  isEncryptionEnabled?: boolean;
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
      reconnection: true,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", (error) => {
      console.error("Chat socket connection error:", error.message);
    });
    socket.on("newMessage", async (message: ChatMessage) => {
      // Decrypt the message if encryption is enabled and content appears encrypted
      if (handlersRef.current.isEncryptionEnabled && handlersRef.current.decryptMessage && message.content && isEncryptedMessage(message.content)) {
        try {
          message.content = await handlersRef.current.decryptMessage(message.content, message.chatRoomId);
        } catch (error) {
          console.error("Failed to decrypt message:", error);
          // Keep original content if decryption fails
        }
      }
      handlersRef.current.onMessage?.(message);
    });
    socket.on("messageUpdated", async (message: ChatMessage) => {
      // Decrypt the message if encryption is enabled and content appears encrypted
      if (handlersRef.current.isEncryptionEnabled && handlersRef.current.decryptMessage && message.content && isEncryptedMessage(message.content)) {
        try {
          message.content = await handlersRef.current.decryptMessage(message.content, message.chatRoomId);
        } catch (error) {
          console.error("Failed to decrypt updated message:", error);
        }
      }
      handlersRef.current.onMessageUpdated?.(message);
    });
    socket.on("messagesDelivered", (payload: MessagesDeliveredPayload) => {
      handlersRef.current.onMessagesDelivered?.(payload);
    });
    socket.on("messagesRead", (payload: MessagesReadPayload) => {
      handlersRef.current.onMessagesRead?.(payload);
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
    socket.on("messagePinned", async (payload: { messageId: number; pinned: boolean; message: ChatMessage }) => {
      // Decrypt the message if encryption is enabled and content appears encrypted
      if (handlersRef.current.isEncryptionEnabled && handlersRef.current.decryptMessage && payload.message?.content && isEncryptedMessage(payload.message.content)) {
        try {
          payload.message.content = await handlersRef.current.decryptMessage(payload.message.content, payload.message.chatRoomId);
        } catch (error) {
          console.error("Failed to decrypt pinned message:", error);
        }
      }
      handlersRef.current.onMessagePinned?.(payload);
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
    async (
      roomId: number,
      content: string,
      kind?: ChatMessageKind,
      language?: ChatLanguage
    ) => {
      let finalContent = content;
      
      // Encrypt the message if encryption is enabled
      if (handlersRef.current.isEncryptionEnabled && handlersRef.current.encryptMessage) {
        try {
          finalContent = await handlersRef.current.encryptMessage(content, roomId);
        } catch (error) {
          console.error("Failed to encrypt message:", error);
          // Send unencrypted if encryption fails
        }
      }
      
      socketRef.current?.emit("sendMessage", {
        roomId,
        content: finalContent,
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

  const pinMessage = useCallback((roomId: number, messageId: number, pinned: boolean) => {
    socketRef.current?.emit("pinMessage", { roomId, messageId, pinned });
  }, []);

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    markAsRead,
    pinMessage,
  };
};
