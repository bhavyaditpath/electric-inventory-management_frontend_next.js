"use client";

import { useCallback } from "react";
import { showSuccess } from "@/Services/toast.service";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import {
  ChatMessageNotification,
  ChatReactionNotification,
} from "@/types/chat.types";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatReactionNotifier() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const handleReactionNotification = useCallback(
    (payload: ChatReactionNotification) => {
      if (payload.action !== "added") return;
      const reactorName = payload.reactorName?.trim() || "Someone";
      showSuccess(`${reactorName} reacted ${payload.emoji} to your message`);
    },
    []
  );

  const handleMessageNotification = useCallback(
    (payload: ChatMessageNotification) => {
      if (payload.senderId === user?.id) return;
      const senderName = payload.senderName?.trim() || "Someone";
      showSuccess(`New message from ${senderName}`);
    },
    [user?.id]
  );

  useChatWebSocket({
    onMessageNotification: handleMessageNotification,
    onReactionNotification: handleReactionNotification,
  });

  if (isLoading || !isAuthenticated) return null;
  return null;
}
