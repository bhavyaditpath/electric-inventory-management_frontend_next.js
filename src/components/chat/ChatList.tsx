'use client';

import { useState, useEffect } from 'react';
import { ChatRoom } from '@/types/chat.types';
import { useAuth } from '@/contexts/AuthContext';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  rooms: ChatRoom[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onCreateNewChat?: () => void;
  loading?: boolean;
}

export default function ChatList({
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateNewChat,
  loading = false,
}: ChatListProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>(rooms);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredRooms(
        rooms.filter(
          (room) =>
            room.name.toLowerCase().includes(query) ||
            room.participants.some((p) =>
              p.username.toLowerCase().includes(query)
            )
        )
      );
    } else {
      setFilteredRooms(rooms);
    }
  }, [searchQuery, rooms]);

  const getOtherParticipant = (room: ChatRoom) => {
    if (room.type === 'direct') {
      return room.participants.find((p) => p.id !== user?.id?.toString());
    }
    return null;
  };

  const getLastMessagePreview = (room: ChatRoom) => {
    if (!room.lastMessage) return 'No messages yet';
    const isOwnMessage = room.lastMessage.senderId === user?.id?.toString();
    const prefix = isOwnMessage ? 'You: ' : '';
    const content = room.lastMessage.content || (room.lastMessage.type === 'image' ? 'Sent an image' : 'Sent a file');
    return prefix + (content.length > 30 ? content.slice(0, 30) + '...' : content);
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
          <button
            onClick={onCreateNewChat}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="New chat"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateNewChat}
                className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Start a new chat
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRooms.map((room) => {
              const otherParticipant = getOtherParticipant(room);
              const isActive = activeRoomId === room.id;
              const hasUnread = room.unreadCount > 0;

              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className={`flex gap-3 p-4 cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {otherParticipant?.profilePicture ? (
                      <img
                        src={otherParticipant.profilePicture}
                        alt={otherParticipant.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {room.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Online indicator */}
                    {otherParticipant?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Room info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`font-medium truncate ${
                          hasUnread ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {room.name}
                      </h3>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {room.lastMessage && getTimeAgo(room.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate ${
                          hasUnread ? 'text-slate-700 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {getLastMessagePreview(room)}
                      </p>
                      {hasUnread && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === room.id ? null : room.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>

                    {menuOpenId === room.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle mute/unmute
                            setMenuOpenId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {hasUnread ? 'Mark as read' : 'Mute notifications'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete
                            setMenuOpenId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
