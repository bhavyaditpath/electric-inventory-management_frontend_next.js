"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ChatRoom, ChatUser } from "@/types/chat.types";
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  BookmarkIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  users: ChatUser[];
  activeTab: "rooms" | "users";
  activeRoomId: number | null;
  loadingRooms?: boolean;
  loadingUsers?: boolean;
  canCreateGroup?: boolean;
  onCreateGroup?: () => void;
  userSearch?: string;
  onUserSearchChange?: (value: string) => void;
  onTabChange: (tab: "rooms" | "users") => void;
  onSelectRoom: (roomId: number) => void;
  onSelectUser: (user: ChatUser) => void;
  onPinRoom?: (roomId: number, pinned: boolean) => void;
  onDeleteRoom?: (roomId: number) => void;
}

const ChatSidebar = ({
  rooms,
  users,
  activeTab,
  activeRoomId,
  loadingRooms,
  loadingUsers,
  canCreateGroup,
  onCreateGroup,
  userSearch,
  onUserSearchChange,
  onTabChange,
  onSelectRoom,
  onSelectUser,
  onPinRoom,
  onDeleteRoom,
}: ChatSidebarProps) => {
  const [openMenuRoomId, setOpenMenuRoomId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => setOpenMenuRoomId(null), []);

  useEffect(() => {
    if (!openMenuRoomId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuRoomId, closeMenu]);

  return (
    <aside className="w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-4 py-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-900">Chat</h2>
        <p className="text-sm text-slate-500">Message Admin and Branches</p>
      </div>

      <div className="px-3 pt-3">
        <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange("rooms")}
            className={`flex-1 text-sm font-medium px-3 py-2 rounded-md transition-colors ${activeTab === "rooms"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              } cursor-pointer`}
          >
            Chats
          </button>
          <button
            onClick={() => onTabChange("users")}
            className={`flex-1 text-sm font-medium px-3 py-2 rounded-md transition-colors ${activeTab === "users"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              } cursor-pointer`}
          >
            Users
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
        {activeTab === "rooms" ? (
          <>
            {loadingRooms ? (
              <div className="text-sm text-slate-500 px-3 py-6 text-center">
                Loading chats...
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-sm text-slate-500 px-3 py-6 text-center">
                No chats yet. Start a new conversation.
              </div>
            ) : (
              rooms.map((room) => {
                const isActive = room.id === activeRoomId;
                const lastMessageLabel = (() => {
                  const last = room.lastMessage;
                  if (!last) return "No messages yet";
                  if (last.content && last.content.trim()) return last.content;
                  if (last.attachments && last.attachments.length > 0) {
                    const count = last.attachments.length;
                    return count === 1 ? "Attachment" : `${count} attachments`;
                  }
                  return "No messages yet";
                })();
                return (
                  <div
                    key={room.id}
                    onClick={() => onSelectRoom(room.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectRoom(room.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${isActive
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/50"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-black">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${isActive
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-black"
                            }`}
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {room.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {lastMessageLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(onPinRoom || onDeleteRoom) && (
                          <div className="relative" ref={menuRef}>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMenuRoomId((prev) =>
                                  prev === room.id ? null : room.id
                                );
                              }}
                              className="p-1 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
                              aria-label="Room actions"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </button>
                            {openMenuRoomId === room.id && (
                              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                                {onPinRoom && (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onPinRoom(room.id, !room.pinned);
                                      closeMenu();
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <BookmarkIcon className="w-4 h-4" />
                                    {room.pinned ? "Unpin" : "Pin"}
                                  </button>
                                )}
                                {onDeleteRoom && (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onDeleteRoom(room.id);
                                      closeMenu();
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {room.unreadCount && room.unreadCount > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <>
            <div className="px-2 space-y-2">
              <input
                value={userSearch || ""}
                onChange={(e) => onUserSearchChange?.(e.target.value)}
                placeholder="Search users..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              {canCreateGroup && (
                <button
                  onClick={onCreateGroup}
                  className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Create Group
                </button>
              )}
            </div>
            {loadingUsers ? (
              <div className="text-sm text-slate-500 px-3 py-6 text-center">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-sm text-slate-500 px-3 py-6 text-center">
                No users available.
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                        <UsersIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.branch || user.role}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${user.isOnline
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default memo(ChatSidebar);
