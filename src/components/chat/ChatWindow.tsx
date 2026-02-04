"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatRoom, ChatUser } from "@/types/chat.types";
import {
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
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
  onSendMessage: (content: string) => void;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, room?.id]);

  useEffect(() => {
    setMessageInput("");
  }, [room?.id]);

  const handleSend = () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !room) return;
    onSendMessage(trimmed);
    setMessageInput("");
  };

  const handleTypingChange = (value: string) => {
    setMessageInput(value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 800);
  };

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

  const visibleTypingUsers = typingUsers.filter(
    (user) => user.id !== currentUserId
  );

  return (
    <section className="flex-1 flex flex-col bg-slate-50">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isMobile && onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
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
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>
        </div>
        {room.isGroupChat && (
          <div className="mt-2">
            <button
              onClick={onOpenMembers}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View members
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
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
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      {message.sender?.username || "User"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
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

      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 sm:gap-3">
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
            className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
