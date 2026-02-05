"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ChatMessage, ChatRoom, ChatUser } from "@/types/chat.types";
import {
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

interface ChatWindowProps {
  room: ChatRoom | null;
  messages: ChatMessage[];
  currentUserId?: number;
  typingUsers: ChatUser[];
  isLoading?: boolean;
  isMobile?: boolean;
  onBack?: () => void;
  onOpenMembers?: () => void;
  onSendMessage: (content: string, files?: File[]) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function ChatWindow({
  room,
  messages,
  currentUserId,
  typingUsers,
  isLoading,
  isMobile,
  onBack,
  onOpenMembers,
  onSendMessage,
  onTyping,
}: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, room?.id]);

  useEffect(() => {
    setMessageInput("");
    setSelectedFiles([]);
    setFileWarning(null);
  }, [room?.id]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = messageInput.trim();
    if (!room) return;
    if (!trimmed && selectedFiles.length === 0) return;
    onSendMessage(trimmed, selectedFiles);
    setMessageInput("");
    setSelectedFiles([]);
  }, [messageInput, onSendMessage, room, selectedFiles]);

  const handleTypingChange = useCallback(
    (value: string) => {
      setMessageInput(value);
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 800);
    },
    [onTyping]
  );

  const visibleTypingUsers = useMemo(
    () => typingUsers.filter((user) => user.id !== currentUserId),
    [typingUsers, currentUserId]
  );

  const previewFiles = useMemo(
    () =>
      selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previewFiles.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [previewFiles]);

  const resolveAttachmentUrl = useCallback(
    (url: string) => {
      if (!url) return url;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      const normalized = url.startsWith("/") ? url : `/${url}`;
      return `${API_BASE_URL}${normalized}`;
    },
    [API_BASE_URL]
  );

  const handlePickFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      setFileWarning(null);
      const filtered = files.filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.type === "application/pdf"
      );
      const sizeOk = filtered.filter((file) => file.size <= MAX_FILE_SIZE);
      if (sizeOk.length < filtered.length) {
        setFileWarning("Some files were too large (max 10 MB) and were skipped.");
      }
      const combined = [...selectedFiles, ...sizeOk].slice(0, MAX_FILES);
      if (combined.length < selectedFiles.length + sizeOk.length) {
        setFileWarning("You can attach up to 10 files per message.");
      }
      setSelectedFiles(combined);
      event.target.value = "";
    },
    [selectedFiles]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
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
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                    }`}
                >
                  {!isMe && (
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      {message.sender?.username || "User"}
                    </p>
                  )}
                  {message.content?.trim() && (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {message.attachments.map((attachment) => {
                          const isImage = attachment.mimeType.startsWith("image/");
                          const url = resolveAttachmentUrl(attachment.url);
                          return (
                            <div
                              key={attachment.id}
                              className={`rounded-lg border ${isMe
                                  ? "border-blue-500/40"
                                  : "border-slate-200"
                                } bg-white/80`}
                            >
                              {isImage ? (
                                <img
                                  src={url}
                                  alt={attachment.fileName}
                                  className="h-28 w-full object-cover rounded-lg"
                                  loading="lazy"
                                  onClick={() =>
                                    setLightbox({
                                      url,
                                      name: attachment.fileName,
                                    })
                                  }
                                />
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 p-2 text-xs text-slate-700 hover:text-slate-900"
                                >
                                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                                    PDF
                                  </span>
                                  <span className="line-clamp-2">
                                    {attachment.fileName}
                                  </span>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p
                    className={`text-[10px] mt-1 ${isMe ? "text-blue-100" : "text-slate-400"
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

      <div className="sticky bottom-0 z-10 px-3 sm:px-4 py-3 sm:py-4 border-t border-slate-200 bg-white">
        {previewFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {previewFiles.map((file, index) => (
              <div
                key={file.id}
                className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-20 w-20 object-cover"
                    onClick={() =>
                      setLightbox({
                        url: file.url,
                        name: file.name,
                      })
                    }
                  />
                ) : (
                  <div className="h-20 w-20 flex items-center justify-center text-xs text-slate-600">
                    PDF
                  </div>
                )}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white/90 text-slate-600 text-xs hover:bg-white"
                  aria-label="Remove file"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
          <button
            onClick={handlePickFiles}
            className="p-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Attach files"
          >
            <PaperClipIcon className="w-4 h-4" />
          </button>
          <input
            value={messageInput}
            onChange={(e) => handleTypingChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            onClick={handleSend}
            className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
          <span>Max 10 files per message.</span>
          <span>Images and PDFs only.</span>
          {fileWarning && (
            <span className="text-amber-600">{fileWarning}</span>
          )}
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-4xl w-full">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white truncate">{lightbox.name}</p>
              <button
                onClick={() => setLightbox(null)}
                className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close preview"
              >
                x
              </button>
            </div>
            <div className="bg-black/40 rounded-lg overflow-hidden">
              <img
                src={lightbox.url}
                alt={lightbox.name}
                className="w-full max-h-[75vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
