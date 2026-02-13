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
  onEndCall,
  onAcceptCall,
  onRejectCall,
  incomingCall,
  callState = CallState.Idle,
  onOpenCallLogs,
}: ChatWindowProps) {
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(
    null
  );
  const [showCallMenu, setShowCallMenu] = useState(false);
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
      <div className="sticky top-0 z-10 px-4 sm:px-6 py-2 sm:py-3 border-b border-slate-200 bg-white/95">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isMobile && onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-blue-50 text-slate-600 cursor-pointer"
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
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Members
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowCallMenu((v) => !v)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {showCallMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Call Actions
                    </p>
                  </div>
                  <div className="px-2 pb-2">
                    <button
                      onClick={() => {
                        if (!canDirectCall) return;
                        setShowCallMenu(false);
                        onStartCall?.(CallType.Audio, otherUserId!);
                      }}
                      disabled={!canDirectCall}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canDirectCall
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={!canDirectCall ? "Available in direct chats only" : "Start audio call"}
                    >
                      <PhoneIcon className="w-4 h-4" />
                      Audio Call
                    </button>

                    <button
                      onClick={() => {
                        if (!canDirectCall) return;
                        setShowCallMenu(false);
                        onStartCall?.(CallType.Video, otherUserId!);
                      }}
                      disabled={!canDirectCall}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canDirectCall
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={!canDirectCall ? "Available in direct chats only" : "Start video call"}
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                      Video Call
                    </button>

                    <button
                      onClick={() => {
                        if (!canGroupCall) return;
                        setShowCallMenu(false);
                        onStartCall?.(CallType.Audio);
                      }}
                      disabled={!canGroupCall}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canGroupCall
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={!canGroupCall ? "Available in group chats only" : "Start group audio call"}
                    >
                      <PhoneIcon className="w-4 h-4" />
                      Audio Group Call
                    </button>

                    <button
                      onClick={() => {
                        if (!canGroupCall) return;
                        setShowCallMenu(false);
                        onStartCall?.(CallType.Video);
                      }}
                      disabled={!canGroupCall}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canGroupCall
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={!canGroupCall ? "Available in group chats only" : "Start group video call"}
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                      Video Group Call
                    </button>
                  </div>

                  <div className="border-t border-gray-100" />

                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
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
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canOpenLogs
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
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
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canOpenLogs
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
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
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canOpenLogs
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
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
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                        canOpenLogs
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
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
