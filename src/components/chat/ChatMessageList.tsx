"use client";

import { useMemo } from "react";
import { ChatMessage, ChatUser } from "@/types/chat.types";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  typingUsers: ChatUser[];
  isLoading?: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  resolveAttachmentUrl: (url: string) => string;
  onOpenLightbox: (url: string, name: string) => void;
}

export default function ChatMessageList({
  messages,
  currentUserId,
  typingUsers,
  isLoading,
  bottomRef,
  resolveAttachmentUrl,
  onOpenLightbox,
}: ChatMessageListProps) {
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
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[50%] w-fit rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                }`}
              >
                {message.content?.trim() && (
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="space-y-2">
                      {message.attachments.map((attachment) => {
                        const isImage = attachment.mimeType.startsWith("image/");
                        const url = resolveAttachmentUrl(attachment.url);
                        const ext = getFileExtension(attachment.fileName || "");
                        const accent = getFileAccent(ext);
                        return (
                          isImage ? (
                            <div
                              key={attachment.id}
                              className={`rounded-lg border ${
                                isMe
                                  ? "border-blue-500/40"
                                  : "border-slate-200"
                              } bg-white/80`}
                            >
                              <img
                                src={url}
                                alt={attachment.fileName}
                                className="h-28 w-full object-cover rounded-lg"
                                loading="lazy"
                                onClick={() =>
                                  onOpenLightbox(url, attachment.fileName)
                                }
                              />
                            </div>
                          ) : (
                            <a
                              key={attachment.id}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-3 rounded-lg border ${
                                isMe
                                  ? "border-blue-500/40"
                                  : "border-slate-200"
                              } bg-white/80 px-3 py-2 text-xs text-slate-700 hover:text-slate-900`}
                            >
                              <span
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-[10px] font-semibold ${accent}`}
                              >
                                {ext}
                              </span>
                              <span className="line-clamp-2">
                                {attachment.fileName}
                              </span>
                            </a>
                          )
                        );
                      })}
                    </div>
                  </div>
                )}
                <p
                  className={`text-[10px] mt-0 ${
                    isMe ? "text-blue-100" : "text-slate-400"
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