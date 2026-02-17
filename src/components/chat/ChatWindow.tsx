"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, ChatRoom, ChatUser } from "@/types/chat.types";
import { CallState, CallType } from "@/types/enums";
import {
  ArrowLeftIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import ChatComposer from "./ChatComposer";
import ChatMessageList from "./ChatMessageList";
import ChatLightbox from "./ChatLightbox";
import { PhoneIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

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

  onStartCall?: (kind: CallType, userId?: number) => void;
  onEndCall?: () => void;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  incomingCall?: number | null;
  callState?: CallState;
  onOpenCallLogs?: (options?: {
    tab?: "history" | "missed" | "room";
    type?: "all" | CallType;
  }) => void;
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
  onStartCall,
  onOpenCallLogs,
}: ChatWindowProps) {
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(
    null
  );
  const [showCallMenu, setShowCallMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const callMenuRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, room?.id]);

  useEffect(() => {
    if (!showCallMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (callMenuRef.current?.contains(target)) return;
      setShowCallMenu(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCallMenu(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showCallMenu]);

  const resolveAttachmentUrl = useCallback(
    (url: string) => {
      if (!url) return url;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      const normalized = url.startsWith("/") ? url : `/${url}`;
      return `${API_BASE_URL}${normalized}`;
    },
    [API_BASE_URL]
  );

  const otherUserId = useMemo(() => {

    if (!room || room.isGroupChat) return null;

    const other = room.participants?.find(
      (p) => p.userId !== currentUserId
    );

    return other?.userId ?? null;
  }, [room, currentUserId]);

  const canDirectCall = !!otherUserId && !room?.isGroupChat;
  const canGroupCall =
    !!room?.isGroupChat &&
    (room.participants || []).filter((p) => p.userId !== currentUserId).length > 0;
  const canOpenLogs = !!onOpenCallLogs;

  const handleStartCall = (type: CallType) => {
    setShowCallMenu(false);

    // Direct chat
    if (canDirectCall && otherUserId) {
      onStartCall?.(type, otherUserId);
      return;
    }

    // Group chat
    if (canGroupCall) {
      onStartCall?.(type);
    }
  };

  if (!room) {
    return (
      <section className="flex-1 flex items-center justify-center bg-[var(--theme-bg)]">
        <div className="text-center max-w-md px-6">
          <h3 className="text-xl font-semibold text-[var(--theme-text)]">
            Select a conversation
          </h3>
          <p className="text-sm text-[var(--theme-text-muted)] mt-2">
            Choose a chat or start a new one from the Users tab.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 bg-[var(--theme-bg)]">
      <div className="sticky top-0 z-10 px-4 sm:px-6 py-2 sm:py-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isMobile && onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-blue-50/30 text-[var(--theme-text-muted)] cursor-pointer"
                aria-label="Back to chats"
              >
                <span className="sr-only">Back</span>
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--theme-text)]">
                {room.name}
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)]">
                {room.isGroupChat ? "Group chat" : "Direct chat"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {room.isGroupChat && (
              <button
                onClick={onOpenMembers}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs font-medium text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
              >
                Members
              </button>
            )}
            <div className="relative" ref={callMenuRef}>
              <button
                onClick={() => setShowCallMenu((v) => !v)}
                className="p-2 rounded-full hover:bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)] cursor-pointer"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {showCallMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
                      Call Actions
                    </p>
                  </div>
                  <div className="px-2 pb-2">

                    {/* AUDIO CALL */}
                    <button
                      onClick={() => handleStartCall(CallType.Audio)}
                      disabled={!canDirectCall && !canGroupCall}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${canDirectCall || canGroupCall
                        ? "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        : "text-[var(--theme-text-muted)]/60 cursor-not-allowed"
                        }`}
                      title={
                        !canDirectCall && !canGroupCall
                          ? "Calling not available"
                          : "Start audio call"
                      }
                    >
                      <PhoneIcon className="w-4 h-4" />
                      Audio Call
                    </button>

                    {/* VIDEO CALL */}
                    <button
                      onClick={() => handleStartCall(CallType.Video)}
                      disabled={!canDirectCall && !canGroupCall}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${canDirectCall || canGroupCall
                        ? "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        : "text-[var(--theme-text-muted)]/60 cursor-not-allowed"
                        }`}
                      title={
                        !canDirectCall && !canGroupCall
                          ? "Calling not available"
                          : "Start video call"
                      }
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                      Video Call
                    </button>
                  </div>
                  <div className="border-t border-[var(--theme-border)]" />

                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
                      Call History
                    </p>
                  </div>
                  <div className="px-2 pb-3">
                    <button
                      onClick={() => {
                        if (!canOpenLogs) return;
                        setShowCallMenu(false);
                        onOpenCallLogs?.({ tab: "history", type: "all" });
                      }}
                      disabled={!canOpenLogs}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${canOpenLogs
                        ? "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        : "text-[var(--theme-text-muted)]/60 cursor-not-allowed"
                        }`}
                    >
                      <ClockIcon className="w-4 h-4" />
                      All Calls
                    </button>
                    <button
                      onClick={() => {
                        if (!canOpenLogs) return;
                        setShowCallMenu(false);
                        onOpenCallLogs?.({ tab: "history", type: CallType.Audio });
                      }}
                      disabled={!canOpenLogs}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${canOpenLogs
                        ? "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        : "text-[var(--theme-text-muted)]/60 cursor-not-allowed"
                        }`}
                    >
                      <PhoneIcon className="w-4 h-4" />
                      Audio Calls
                    </button>
                    <button
                      onClick={() => {
                        if (!canOpenLogs) return;
                        setShowCallMenu(false);
                        onOpenCallLogs?.({ tab: "history", type: CallType.Video });
                      }}
                      disabled={!canOpenLogs}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${canOpenLogs
                        ? "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        : "text-[var(--theme-text-muted)]/60 cursor-not-allowed"
                        }`}
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                      Video Calls
                    </button>
                    <button
                      onClick={() => {
                        if (!canOpenLogs) return;
                        setShowCallMenu(false);
                        onOpenCallLogs?.({ tab: "missed", type: "all" });
                      }}
                      disabled={!canOpenLogs}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${canOpenLogs
                        ? "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        : "text-[var(--theme-text-muted)]/60 cursor-not-allowed"
                        }`}
                    >
                      <ClockIcon className="w-4 h-4" />
                      Missed Calls
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        {room.isGroupChat && (
          <div className="mt-2 sm:hidden">
            <button
              onClick={onOpenMembers}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
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
        isGroupChat={room.isGroupChat}
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

