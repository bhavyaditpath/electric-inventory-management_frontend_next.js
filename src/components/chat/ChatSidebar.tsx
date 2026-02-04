"use client";

import { ChatRoom, ChatUser } from "@/types/chat.types";
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  users: ChatUser[];
  activeTab: "rooms" | "users";
  activeRoomId: number | null;
  loadingRooms?: boolean;
  loadingUsers?: boolean;
  onTabChange: (tab: "rooms" | "users") => void;
  onSelectRoom: (roomId: number) => void;
  onSelectUser: (user: ChatUser) => void;
}

export default function ChatSidebar({
  rooms,
  users,
  activeTab,
  activeRoomId,
  loadingRooms,
  loadingUsers,
  onTabChange,
  onSelectRoom,
  onSelectUser,
}: ChatSidebarProps) {
  return (
    <aside className="w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-4 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Chat</h2>
        <p className="text-sm text-slate-500">Message Admin and Branches</p>
      </div>

      <div className="px-3 pt-3">
        <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => onTabChange("rooms")}
            className={`flex-1 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              activeTab === "rooms"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => onTabChange("users")}
            className={`flex-1 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              activeTab === "users"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
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
                return (
                  <button
                    key={room.id}
                    onClick={() => onSelectRoom(room.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            isActive
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {room.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {room.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                      {room.unreadCount && room.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </>
        ) : (
          <>
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
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
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
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        user.isOnline
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
}
