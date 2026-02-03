'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatRoom, Message, User } from '@/types/chat.types';
import { useAuth } from '@/contexts/AuthContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface ChatWindowProps {
  room: ChatRoom | null;
  messages: Message[];
  typingUsers: Set<string>;
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', attachmentUrl?: string) => void;
  onTyping: (isTyping: boolean) => void;
  onLoadMore: () => Promise<void>;
  hasMoreMessages: boolean;
  loading?: boolean;
  isMobile?: boolean;
  onBack?: () => void;
}

export default function ChatWindow({
  room,
  messages,
  typingUsers,
  onSendMessage,
  onTyping,
  onLoadMore,
  hasMoreMessages,
  loading = false,
  isMobile = false,
  onBack,
}: ChatWindowProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMoreMessages || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMoreMessages, loading, onLoadMore]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const atBottom =
      Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 50;
    setIsAtBottom(atBottom);
  };

  const getOtherParticipants = (): User[] => {
    if (!room) return [];
    const others = (room.participants ?? []).filter(
      (p) => p.id !== user?.id?.toString()
    );
    if (others.length > 0) return others;
    return [
      {
        id: '',
        username: room.name,
        role: 'admin',
        profilePicture: undefined,
        branchId: undefined,
        branchName: undefined,
        isOnline: false,
      },
    ];
  };

  const formatHeaderTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!room) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-16 h-16 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">
            Welcome to Chat
          </h3>
          <p className="text-slate-500 text-sm">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        {isMobile && onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* Room avatar */}
        {(room.type ?? 'direct') === 'direct' ? (
          getOtherParticipants().map((participant) => (
            <div key={participant.id} className="relative">
              {participant.profilePicture ? (
                <img
                  src={participant.profilePicture}
                  alt={participant.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {participant.username.charAt(0).toUpperCase()}
                </div>
              )}
              {participant.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
          ))
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-medium">
            {room.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Room info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{room.name}</h3>
        {(room.type ?? 'direct') === 'direct' &&
          getOtherParticipants()[0]?.isOnline && (
            <p className="text-xs text-green-500">Online</p>
          )}
          {(room.type ?? 'direct') === 'group' && (
            <p className="text-xs text-slate-500">
              {(room.participants ?? []).length} participants
            </p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onScroll={handleScroll}
      >
        {/* Load more trigger */}
        {hasMoreMessages && (
          <div
            ref={loadMoreRef}
            className="flex justify-center py-2"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                Loading more...
              </div>
            ) : (
              <button
                onClick={() => onLoadMore()}
                className="text-blue-500 text-sm hover:text-blue-600"
              >
                Load more messages
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === user?.id?.toString();
          const previousMessage = index > 0 ? messages[index - 1] : undefined;
          const showAvatar = !isOwnMessage && (!previousMessage || previousMessage.senderId !== message.senderId);
          const showName = !isOwnMessage && room.type === 'group' && (!previousMessage || previousMessage.senderId !== message.senderId);

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              showAvatar={showAvatar}
              showName={showName}
              previousMessage={previousMessage}
            />
          );
        })}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex gap-2 px-4 py-1">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing
            </span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        typingUsers={typingUsers}
        disabled={loading}
      />
    </div>
  );
}
