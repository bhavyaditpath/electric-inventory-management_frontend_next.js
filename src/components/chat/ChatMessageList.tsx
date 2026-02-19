"use client";

import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChatAttachment, ChatMessage, ChatUser } from "@/types/chat.types";
import {
  EllipsisHorizontalIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { chatApi } from "@/Services/chat.api";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

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
  onReactionUpdated?: (message: ChatMessage) => void;
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
  onReactionUpdated,
}: ChatMessageListProps) {
  type MessageReactionView = {
    emoji: string;
    count: number;
    reactedByMe: boolean;
  };

  const [openMenuMessageId, setOpenMenuMessageId] = useState<number | null>(
    null
  );
  const [openAttachmentMenuId, setOpenAttachmentMenuId] = useState<number | null>(
    null
  );
  const [fullReactionPickerMessageId, setFullReactionPickerMessageId] = useState<number | null>(
    null
  );
  const [reactionPickerPosition, setReactionPickerPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [reactionOverrides, setReactionOverrides] = useState<
    Record<number, MessageReactionView[]>
  >({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const reactionActionRef = useRef<HTMLDivElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);
  const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "👏", "😮"];

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
    return "bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)] border-[var(--theme-border)]";
  };

  const visibleTypingUsers = useMemo(
    () => typingUsers.filter((user) => user.id !== currentUserId),
    [typingUsers, currentUserId]
  );

  const hasText = (value?: string) => !!value && value.trim().length > 0;

  const isImageAttachment = (mimeType: string) => mimeType.startsWith("image/");

  const normalizeReactions = useCallback(
    (input: unknown): MessageReactionView[] => {
      if (!Array.isArray(input)) return [];

      return input
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const raw = item as Record<string, unknown>;
          const emoji = typeof raw.emoji === "string" ? raw.emoji : "";
          if (!emoji) return null;

          const userIds = Array.isArray(raw.userIds)
            ? raw.userIds.filter((id): id is number => typeof id === "number")
            : [];
          const users = Array.isArray(raw.users) ? raw.users : [];

          const countFromUsers = userIds.length || users.length || 0;
          const count =
            typeof raw.count === "number"
              ? raw.count
              : typeof raw.total === "number"
                ? raw.total
                : countFromUsers;

          let reactedByMe = false;
          if (typeof raw.reactedByMe === "boolean") {
            reactedByMe = raw.reactedByMe;
          } else if (typeof currentUserId === "number") {
            reactedByMe =
              userIds.includes(currentUserId) ||
              users.some((u) => {
                if (typeof u === "number") return u === currentUserId;
                if (!u || typeof u !== "object") return false;
                const user = u as Record<string, unknown>;
                return user.id === currentUserId || user.userId === currentUserId;
              });
          }

          return {
            emoji,
            count: Math.max(1, count),
            reactedByMe,
          };
        })
        .filter((reaction): reaction is MessageReactionView => !!reaction);
    },
    [currentUserId]
  );

  const getMessageReactions = useCallback(
    (message: ChatMessage) => {
      const override = reactionOverrides[message.id];
      if (override) return override;
      return normalizeReactions((message as ChatMessage & { reactions?: unknown }).reactions);
    },
    [normalizeReactions, reactionOverrides]
  );

  const getMessageFromCollection = useCallback(
    (messageId: number) => messages.find((m) => m.id === messageId),
    [messages]
  );

  const computeNextReactions = useCallback(
    (base: MessageReactionView[], emoji: string) => {
      const target = base.find((r) => r.emoji === emoji);
      if (!target) {
        return [...base, { emoji, count: 1, reactedByMe: true }];
      }

      if (target.reactedByMe) {
        if (target.count <= 1) {
          return base.filter((r) => r.emoji !== emoji);
        }
        return base.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r
        );
      }

      return base.map((r) =>
        r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r
      );
    },
    []
  );

  const handleToggleReaction = useCallback(
    async (messageId: number, emoji: string) => {
      let previousSnapshot: MessageReactionView[] = [];

      setReactionOverrides((prev) => {
        const base =
          prev[messageId] ??
          normalizeReactions(
            (getMessageFromCollection(messageId) as ChatMessage & {
              reactions?: unknown;
            } | null)?.reactions
          );
        previousSnapshot = base;
        return {
          ...prev,
          [messageId]: computeNextReactions(base, emoji),
        };
      });

      try {
        const response = await chatApi.toggleMessageReaction(messageId, emoji);
        if (response.success && response.data) {
          onReactionUpdated?.(response.data);
          setReactionOverrides((prev) => {
            const next = { ...prev };
            delete next[messageId];
            return next;
          });
          return;
        }

        const serverReactions = (response.data as ChatMessage & { reactions?: unknown } | undefined)?.reactions;
        if (Array.isArray(serverReactions)) {
          setReactionOverrides((prev) => ({
            ...prev,
            [messageId]: normalizeReactions(serverReactions),
          }));
        }
      } catch (error) {
        console.error("Failed to toggle reaction:", error);
        setReactionOverrides((prev) => ({
          ...prev,
          [messageId]: previousSnapshot,
        }));
      }
    },
    [computeNextReactions, getMessageFromCollection, normalizeReactions, onReactionUpdated]
  );

  useEffect(() => {
    if (fullReactionPickerMessageId == null) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (reactionActionRef.current?.contains(target)) return;
      if (reactionPickerRef.current?.contains(target)) return;
      setFullReactionPickerMessageId(null);
      setReactionPickerPosition(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fullReactionPickerMessageId]);

  useEffect(() => {
    if (fullReactionPickerMessageId == null) return;
    const closePicker = () => {
      setFullReactionPickerMessageId(null);
      setReactionPickerPosition(null);
    };
    window.addEventListener("resize", closePicker);
    window.addEventListener("scroll", closePicker, true);
    return () => {
      window.removeEventListener("resize", closePicker);
      window.removeEventListener("scroll", closePicker, true);
    };
  }, [fullReactionPickerMessageId]);

  const handleOpenMoreReactions = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, messageId: number) => {
      const nextId = fullReactionPickerMessageId === messageId ? null : messageId;
      if (nextId == null) {
        setFullReactionPickerMessageId(null);
        setReactionPickerPosition(null);
        return;
      }

      const triggerRect = event.currentTarget.getBoundingClientRect();
      const listRect = listRef.current?.getBoundingClientRect();
      const horizontalPadding = 8;
      const pickerHeight = 320;
      const defaultWidth = 288;
      const maxWidthByList = listRect
        ? Math.max(220, listRect.width - horizontalPadding * 2)
        : window.innerWidth - horizontalPadding * 2;
      const width = Math.min(defaultWidth, maxWidthByList);

      const minLeft = (listRect?.left ?? 0) + horizontalPadding;
      const maxLeft = (listRect?.right ?? window.innerWidth) - width - horizontalPadding;
      let left = triggerRect.left + triggerRect.width / 2 - width / 2;
      left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

      let top = triggerRect.bottom + 8;
      if (top + pickerHeight > window.innerHeight - horizontalPadding) {
        top = Math.max(horizontalPadding, triggerRect.top - pickerHeight - 8);
      }

      setReactionPickerPosition({ top, left, width });
      setFullReactionPickerMessageId(messageId);
    },
    [fullReactionPickerMessageId]
  );

  const handleDownloadAttachment = async (attachment: ChatAttachment) => {
    try {
      const { blob, filename } = await chatApi.downloadAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download attachment:", error);
    }
  };

  return (
    <div
      ref={listRef}
      className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4 space-y-4 scrollbar-default bg-[var(--theme-bg)]"
    >
      {isLoading ? (
        <div className="text-sm text-[var(--theme-text-muted)] px-3 py-6 text-center">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="text-sm text-[var(--theme-text-muted)] px-3 py-6 text-center">
          No messages yet. Say hello.
        </div>
      ) : (
        messages.map((message) => {
          const isMe = message.senderId === currentUserId;
          const canDelete = !!onDeleteMessage && (isMe || isAdmin);
          const senderName = message.sender?.username || "Unknown";
          const reactions = getMessageReactions(message);
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] md:max-w-[60%] w-fit min-w-0 rounded-2xl px-3 sm:px-4 py-2 text-sm shadow-sm ${isMe
                  ? "bg-blue-600 text-white border border-blue-600 rounded-br-md"
                  : "bg-[var(--theme-surface)] text-[var(--theme-text)] border border-[var(--theme-border)] rounded-bl-md"
                  } relative group`}
              >
                <div
                  className={`absolute -top-5 z-30 hidden sm:flex items-center ${isMe ? "right-0" : "left-0"}`}
                  ref={
                    fullReactionPickerMessageId === message.id
                      ? reactionActionRef
                      : null
                  }
                >
                  <div className="inline-flex max-w-[min(20rem,calc(100vw-2rem))] items-center gap-1 px-1.5 py-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={`${message.id}-quick-${emoji}`}
                        onClick={() => {
                          void handleToggleReaction(message.id, emoji);
                          setFullReactionPickerMessageId(null);
                        }}
                        className="h-6 w-6 rounded-full hover:bg-[var(--theme-surface-muted)] text-sm"
                        aria-label={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      onClick={(event) => handleOpenMoreReactions(event, message.id)}
                      className="h-6 w-6 rounded-full hover:bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)] inline-flex items-center justify-center"
                      aria-label="More emojis"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isGroupChat && (
                  <p
                    className={`text-[11px] font-semibold mb-1 ${isMe ? "text-blue-100" : "text-[var(--theme-text-muted)]"
                      }`}
                  >
                    {senderName}
                  </p>
                )}
                {hasText(message.content) && (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
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
                            className={`w-full overflow-hidden rounded-lg border cursor-pointer ${isMe
                              ? "border-white/20"
                              : "border-[var(--theme-border)]"
                              }`}
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

                      const isPdf = extension === "PDF";

                      if (isPdf) {
                        return (
                          <div
                            key={attachment.id}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${isMe
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-[var(--theme-surface-muted)] border-[var(--theme-border)] text-[var(--theme-text)]"
                              }`}
                          >
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
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
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenAttachmentMenuId((prev) =>
                                    prev === attachment.id ? null : attachment.id
                                  )
                                }
                                className={`p-1 rounded-full cursor-pointer ${isMe
                                  ? "text-blue-100 hover:text-white"
                                  : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                                  }`}
                                aria-label="Attachment actions"
                              >
                                <EllipsisHorizontalIcon className="w-4 h-4" />
                              </button>
                              {openAttachmentMenuId === attachment.id && (
                                <div className="absolute right-0 top-6 w-32 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg z-20">
                                  <button
                                    onClick={() => {
                                      handleDownloadAttachment(attachment);
                                      setOpenAttachmentMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
                                  >
                                    Download
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <a
                          key={attachment.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs cursor-pointer ${isMe
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-[var(--theme-surface-muted)] border-[var(--theme-border)] text-[var(--theme-text)]"
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
                    className={`text-[10px] mt-0 ${isMe ? "text-blue-100" : "text-[var(--theme-text-muted)]"
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
                      className={`p-1 rounded-full cursor-pointer ${isMe
                        ? "text-blue-100 hover:text-white"
                        : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        }`}
                      aria-label="Message actions"
                    >
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                    </button>
                      {openMenuMessageId === message.id && (
                        <div className="absolute right-0 top-6 w-32 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg z-20">
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
                {reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {reactions.map((reaction) => (
                      <button
                        key={`${message.id}-${reaction.emoji}`}
                        onClick={() => void handleToggleReaction(message.id, reaction.emoji)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] transition cursor-pointer ${reaction.reactedByMe
                          ? "bg-sky-100 text-sky-700 border-sky-300"
                          : "bg-white/80 text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        aria-label={`React with ${reaction.emoji}`}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="font-semibold">{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      {fullReactionPickerMessageId != null && reactionPickerPosition && (
        <div
          ref={reactionPickerRef}
          className="fixed z-50 shadow-xl rounded-xl overflow-hidden"
          style={{
            top: `${reactionPickerPosition.top}px`,
            left: `${reactionPickerPosition.left}px`,
            width: `${reactionPickerPosition.width}px`,
          }}
        >
          <EmojiPicker
            onEmojiClick={(emojiData: EmojiClickData) => {
              void handleToggleReaction(fullReactionPickerMessageId, emojiData.emoji);
              setFullReactionPickerMessageId(null);
              setReactionPickerPosition(null);
            }}
            lazyLoadEmojis
            width="100%"
            height={320}
            skinTonesDisabled
          />
        </div>
      )}
      {visibleTypingUsers.length > 0 && (
        <div className="text-xs text-[var(--theme-text-muted)] px-2">
          {visibleTypingUsers.map((u) => u.username).join(", ")} typing...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
