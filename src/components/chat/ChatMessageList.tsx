"use client";

import { useMemo, useState } from "react";
import { ChatMessage, ChatUser } from "@/types/chat.types";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  typingUsers: ChatUser[];
  isLoading?: boolean;
  isGroupChat?: boolean;
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
  isGroupChat,
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

  const hasText = (value?: string) => !!value && value.trim().length > 0;

  const isImageAttachment = (mimeType: string) => mimeType.startsWith("image/");

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
          const senderName = message.sender?.username || "Unknown";
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
                {isGroupChat && (
                  <p
                    className={`text-[11px] font-semibold mb-1 ${isMe ? "text-blue-100" : "text-slate-500"
                      }`}
                  >
                    {senderName}
                  </p>
                )}
                {hasText(message.content) && (
                  <p className="text-sm leading-relaxed break-words">
                    {message.content}
                  </p>
                )}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => {
                      const fileUrl = resolveAttachmentUrl(attachment.url);
                      const extension = getFileExtension(attachment.fileName);
                      const isImage = isImageAttachment(attachment.mimeType);

                      if (isImage) {
                        return (
                          <button
                            key={attachment.id}
                            onClick={() =>
                              onOpenLightbox(fileUrl, attachment.fileName)
                            }
                            className="w-full overflow-hidden rounded-lg border border-white/20 cursor-pointer"
                            aria-label={`Open ${attachment.fileName}`}
                          >
                            <img
                              src={fileUrl}
                              alt={attachment.fileName}
                              className="w-full max-h-56 object-cover"
                            />
                          </button>
                        );
                      }

                      return (
                        <a
                          key={attachment.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs cursor-pointer ${isMe ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center rounded-full border px-2 py-1 text-[10px] font-semibold ${getFileAccent(
                              extension
                            )}`}
                          >
                            {extension}
                          </span>
                          <span className="truncate flex-1">
                            {attachment.fileName}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-[10px] mt-0 ${isMe ? "text-blue-100" : "text-slate-400"
                      }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {canDelete && (
                    <div className="flex justify-end relative">
                    <button
                      onClick={() =>
                        setOpenMenuMessageId((prev) =>
                          prev === message.id ? null : message.id
                        )
                      }
                      className={`p-1 rounded-full cursor-pointer ${isMe ? "text-blue-100 hover:text-white" : "text-slate-400 hover:text-slate-600"
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
                            className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
