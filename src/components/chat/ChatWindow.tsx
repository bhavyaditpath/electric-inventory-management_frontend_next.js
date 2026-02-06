"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, ChatRoom, ChatUser } from "@/types/chat.types";
import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import ChatComposer from "./ChatComposer";
import ChatMessageList from "./ChatMessageList";
import ChatLightbox from "./ChatLightbox";

interface ChatWindowProps {
  room: ChatRoom | null;
  messages: ChatMessage[];
  currentUserId?: number;
  typingUsers: ChatUser[];
  isLoading?: boolean;
  isMobile?: boolean;
  isAdmin?: boolean;
  onBack?: () => void;
  onOpenMembers?: () => void;
  onSendMessage: (content: string, files?: File[]) => void;
  onTyping: (isTyping: boolean) => void;
  onDeleteMessage?: (messageId: number) => void;
}

export default function ChatWindow({
  room,
  messages,
  currentUserId,
  typingUsers,
  isLoading,
  isMobile,
  isAdmin,
  onBack,
  onOpenMembers,
  onSendMessage,
  onTyping,
  onDeleteMessage,
}: ChatWindowProps) {
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(
    null
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, room?.id]);

  const resolveAttachmentUrl = useCallback(
    (url: string) => {
      if (!url) return url;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      const normalized = url.startsWith("/") ? url : `/${url}`;
      return `${API_BASE_URL}${normalized}`;
    },
    [API_BASE_URL]
  );

  if (!room) {
    return (
      <section className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-6">
          <h3 className="text-xl font-semibold text-slate-800">
            Select a conversation
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Choose a chat or start a new one from the Users tab.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div className="sticky top-0 z-10 px-4 sm:px-5 py-2 sm:py-2 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isMobile && onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-blue-50 text-slate-600"
                aria-label="Back to chats"
              >
                <span className="sr-only">Back</span>
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                {room.name}
              </h3>
              <p className="text-xs text-slate-500">
                {room.isGroupChat ? "Group chat" : "Direct chat"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {room.isGroupChat && (
              <button
                onClick={onOpenMembers}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Members
              </button>
            )}
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {room.isGroupChat && (
          <div className="mt-2 sm:hidden">
            <button
              onClick={onOpenMembers}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View members
            </button>
          </div>
        )}
      </div>

      <ChatMessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        isLoading={isLoading}
        bottomRef={bottomRef}
        resolveAttachmentUrl={resolveAttachmentUrl}
        onOpenLightbox={(url, name) => setLightbox({ url, name })}
        isAdmin={isAdmin}
        onDeleteMessage={onDeleteMessage}
      />

      <ChatComposer
        roomId={room?.id}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        onOpenLightbox={(url, name) => setLightbox({ url, name })}
      />
      <ChatLightbox lightbox={lightbox} onClose={() => setLightbox(null)} />
    </section>
  );
}
