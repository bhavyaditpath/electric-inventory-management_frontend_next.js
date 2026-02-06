"use client";

import { useMemo, useState } from "react";
import { ChatMessage, ChatUser } from "@/types/chat.types";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  typingUsers: ChatUser[];
  isLoading?: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  resolveAttachmentUrl: (url: string) => string;
  onOpenLightbox: (url: string, name: string) => void;
  isAdmin?: boolean;
  onDeleteMessage?: (messageId: number) => void;
}

export default function ChatMessageList({
  messages,
  currentUserId,
  typingUsers,
  isLoading,
  bottomRef,
  resolveAttachmentUrl,
  onOpenLightbox,
  isAdmin,
  onDeleteMessage,
}: ChatMessageListProps) {
  const [openMenuMessageId, setOpenMenuMessageId] = useState<number | null>(
    null
  );

  const getFileExtension = (name: string) => {
    const parts = name.split(".");
    if (parts.length < 2) return "FILE";
    return parts[parts.length - 1].toUpperCase();
  };

  const getFileAccent = (ext: string) => {
    if (ext === "PDF") return "bg-rose-100 text-rose-700 border-rose-200";
    if (ext === "XLS" || ext === "XLSX")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (ext === "CSV") return "bg-lime-100 text-lime-700 border-lime-200";
    if (ext === "ZIP" || ext === "RAR")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const visibleTypingUsers = useMemo(
    () => typingUsers.filter((user) => user.id !== currentUserId),
    [typingUsers, currentUserId]
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 scrollbar-default">
      {isLoading ? (
        <div className="text-sm text-slate-500 px-3 py-6 text-center">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="text-sm text-slate-500 px-3 py-6 text-center">
          No messages yet. Say hello.
        </div>
      ) : (
        messages.map((message) => {
          const isMe = message.senderId === currentUserId;
          const canDelete = !!onDeleteMessage && (isMe || isAdmin);
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[50%] w-fit rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                  }`}
              >
                {canDelete && (
                  <div className="flex justify-end relative">
                    <button
                      onClick={() =>
                        setOpenMenuMessageId((prev) =>
                          prev === message.id ? null : message.id
                        )
                      }
                      className={`p-1 rounded-full ${isMe ? "text-blue-100 hover:text-white" : "text-slate-400 hover:text-slate-600"
                        }`}
                      aria-label="Message actions"
                    >
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                    </button>
                    {openMenuMessageId === message.id && (
                      <div className="absolute right-0 top-6 w-32 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                        <button
                          onClick={() => {
                            onDeleteMessage?.(message.id);
                            setOpenMenuMessageId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <p
                  className={`text-[10px] mt-0 ${isMe ? "text-blue-100" : "text-slate-400"
                    }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })
      )}
      {visibleTypingUsers.length > 0 && (
        <div className="text-xs text-slate-500 px-2">
          {visibleTypingUsers.map((u) => u.username).join(", ")} typing...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
