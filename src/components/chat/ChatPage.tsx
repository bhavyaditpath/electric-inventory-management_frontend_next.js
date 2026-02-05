"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/Services/chat.api";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/enums";
import { ChatMessage, ChatRoom, ChatUser } from "@/types/chat.types";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { ArrowPathIcon, SignalIcon } from "@heroicons/react/24/outline";

export default function ChatPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"rooms" | "users">("rooms");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMembersSearch, setAddMembersSearch] = useState("");
  const [selectedAddUserIds, setSelectedAddUserIds] = useState<number[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersRoom, setMembersRoom] = useState<ChatRoom | null>(null);
  const joinedRoomRef = useRef<number | null>(null);
  const activeRoomIdRef = useRef<number | null>(null);
  const typingTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const getBranchLabel = useCallback((value: unknown, fallback?: string) => {
    if (!value) return fallback || "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const maybeName = (value as { name?: string }).name;
      if (typeof maybeName === "string") return maybeName;
    }
    return fallback || "";
  }, []);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    return () => {
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setShowChat(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const response = await chatApi.getRooms();
      if (response.success && response.data) {
        setRooms(response.data);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await chatApi.getUsersWithOnlineStatus();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleIncomingMessage = useCallback((message: ChatMessage) => {
    const currentRoomId = activeRoomIdRef.current;
    if (currentRoomId === message.chatRoomId) {
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message]
      );
    }

    setRooms((prev) => {
      const found = prev.find((room) => room.id === message.chatRoomId);
      if (!found) {
        fetchRooms();
        return prev;
      }
      return prev.map((room) => {
        if (room.id !== message.chatRoomId) return room;
        const unreadCount =
          currentRoomId === room.id ? 0 : (room.unreadCount || 0) + 1;
        return { ...room, lastMessage: message, unreadCount };
      });
    });
  }, [fetchRooms]);

  const handleTyping = useCallback((payload: { userId: number; isTyping: boolean }) => {
    if (!activeRoomIdRef.current) return;
    setTypingUserIds((prev) => {
      const exists = prev.includes(payload.userId);
      if (payload.isTyping && !exists) {
        return [...prev, payload.userId];
      }
      if (!payload.isTyping && exists) {
        return prev.filter((id) => id !== payload.userId);
      }
      return prev;
    });

    if (payload.isTyping) {
      const timer = typingTimersRef.current.get(payload.userId);
      if (timer) clearTimeout(timer);
      const timeout = setTimeout(() => {
        setTypingUserIds((prev) => prev.filter((id) => id !== payload.userId));
        typingTimersRef.current.delete(payload.userId);
      }, 1500);
      typingTimersRef.current.set(payload.userId, timeout);
      return;
    }
    const timer = typingTimersRef.current.get(payload.userId);
    if (timer) clearTimeout(timer);
    typingTimersRef.current.delete(payload.userId);
  }, []);

  const handleUserOnline = useCallback((userId: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isOnline: true } : u))
    );
  }, []);

  const handleUserOffline = useCallback((userId: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isOnline: false } : u))
    );
  }, []);

  const {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    markAsRead,
  } = useChatWebSocket({
    onMessage: handleIncomingMessage,
    onTyping: handleTyping,
    onUserOnline: handleUserOnline,
    onUserOffline: handleUserOffline,
  });

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, [fetchRooms, fetchUsers]);

  const refreshData = useCallback(() => {
    fetchRooms();
    fetchUsers();
  }, [fetchRooms, fetchUsers]);

  useEffect(() => {
    if (!activeRoomId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        if (joinedRoomRef.current && joinedRoomRef.current !== activeRoomId) {
          leaveRoom(joinedRoomRef.current);
        }
        joinRoom(activeRoomId);
        joinedRoomRef.current = activeRoomId;

        const response = await chatApi.getMessages(activeRoomId, 1, 50);
        if (response.success && response.data) {
          setMessages(response.data.messages || []);
        } else {
          setMessages([]);
        }

        await chatApi.markAsRead(activeRoomId);
        markAsRead(activeRoomId);
        setRooms((prev) =>
          prev.map((room) =>
            room.id === activeRoomId ? { ...room, unreadCount: 0 } : room
          )
        );
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeRoomId, joinRoom, leaveRoom, markAsRead]);

  const handleSelectRoom = useCallback(
    (roomId: number) => {
      setActiveRoomId(roomId);
      setActiveTab("rooms");
      if (isMobile) setShowChat(true);
    },
    [isMobile]
  );

  const handleSelectUser = useCallback(
    async (targetUser: ChatUser) => {
      try {
        const response = await chatApi.getOrCreateDirectChat(targetUser.id);
        if (response.success && response.data) {
          const room = response.data;
          setRooms((prev) => {
            const exists = prev.some((r) => r.id === room.id);
            return exists ? prev : [room, ...prev];
          });
          setActiveRoomId(room.id);
          setActiveTab("rooms");
          if (isMobile) setShowChat(true);
        }
      } catch (error) {
        console.error("Failed to start chat:", error);
      }
    },
    [isMobile]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeRoomId) return;
      if (isConnected) {
        sendMessage(activeRoomId, content);
        return;
      }
      try {
        const response = await chatApi.sendMessage({
          chatRoomId: activeRoomId,
          content,
        });
        if (response.success && response.data) {
          handleIncomingMessage(response.data);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeRoomId, handleIncomingMessage, isConnected, sendMessage]
  );

  const handleTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!activeRoomId) return;
      sendTyping(activeRoomId, isTyping);
    },
    [activeRoomId, sendTyping]
  );

  const filteredUsers = useMemo(() => {
    if (!groupSearch) return users;
    const query = groupSearch.toLowerCase();
    return users.filter((u) => {
      const branchLabel = getBranchLabel(u.branch, u.role);
      return (
        u.username.toLowerCase().includes(query) ||
        branchLabel.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    });
  }, [users, groupSearch, getBranchLabel]);

  const eligibleAddUsers = useMemo(() => {
    const participantIds = new Set(
      (membersRoom?.participants || []).map((p) => p.userId)
    );
    const baseList = users.filter((u) => !participantIds.has(u.id));
    if (!addMembersSearch) return baseList;
    const query = addMembersSearch.toLowerCase();
    return baseList.filter((u) => {
      const branchLabel = getBranchLabel(u.branch, u.role);
      return (
        u.username.toLowerCase().includes(query) ||
        branchLabel.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    });
  }, [users, membersRoom, addMembersSearch, getBranchLabel]);

  const toggleGroupUser = useCallback((userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const toggleAddMemberUser = useCallback((userId: number) => {
    setSelectedAddUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const handleOpenCreateGroup = useCallback(() => {
    setShowCreateGroup(true);
  }, []);

  const handleCloseCreateGroup = useCallback(() => {
    setShowCreateGroup(false);
  }, []);

  const handleOpenAddMembers = useCallback(() => {
    setShowAddMembers(true);
  }, []);

  const handleCloseAddMembers = useCallback(() => {
    setShowAddMembers(false);
    setAddMembersSearch("");
    setSelectedAddUserIds([]);
  }, []);

  const handleCloseMembers = useCallback(() => {
    setShowMembers(false);
    setShowAddMembers(false);
    setAddMembersSearch("");
    setSelectedAddUserIds([]);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowChat(false);
  }, []);

  const handleCreateGroup = async () => {
    if (!user?.id) return;
    const name = groupName.trim();
    if (!name) return;
    if (selectedUserIds.length < 1) return;

    try {
      const payload = {
        name,
        isGroupChat: true,
        participantIds: selectedUserIds,
      };
      const response = await chatApi.createRoom(payload);
      if (response.success && response.data) {
        const room = response.data;
        setRooms((prev) => [room, ...prev]);
        setActiveRoomId(room.id);
        setActiveTab("rooms");
        setShowCreateGroup(false);
        setGroupName("");
        setGroupSearch("");
        setSelectedUserIds([]);
        if (isMobile) setShowChat(true);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleAddMembers = async () => {
    if (!activeRoomId) return;
    if (selectedAddUserIds.length === 0) return;

    try {
      setAddingMembers(true);
      const response = await chatApi.addParticipants(activeRoomId, {
        participantIds: selectedAddUserIds,
      });
      if (response.success && response.data) {
        setMembersRoom(response.data);
      }
      handleCloseAddMembers();
    } catch (error) {
      console.error("Failed to add participants:", error);
    } finally {
      setAddingMembers(false);
    }
  };

  const openMembers = useCallback(async () => {
    if (!activeRoomId) return;
    setShowMembers(true);
    setMembersLoading(true);
    try {
      const response = await chatApi.getRoom(activeRoomId);
      if (response.success && response.data) {
        setMembersRoom(response.data);
      } else {
        setMembersRoom(null);
      }
    } catch (error) {
      console.error("Failed to load group members:", error);
      setMembersRoom(null);
    } finally {
      setMembersLoading(false);
    }
  }, [activeRoomId]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const typingUsers = useMemo(
    () => users.filter((u) => typingUserIds.includes(u.id)),
    [users, typingUserIds]
  );

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {isMobile ? (
        <div className="flex-1 flex flex-col min-h-0">
          {!showChat && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Messages
                  </h1>
                  <p className="text-xs text-slate-500">
                    {user?.role} user - {isConnected ? "Connected" : "Offline"}
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="p-2 rounded-md border border-slate-200 hover:bg-slate-50"
                  aria-label="Refresh"
                >
                  <ArrowPathIcon className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <ChatSidebar
                rooms={rooms}
                users={filteredUsers}
                activeTab={activeTab}
                activeRoomId={activeRoomId}
                loadingRooms={loadingRooms}
                loadingUsers={loadingUsers}
                canCreateGroup={isAdmin}
                onCreateGroup={handleOpenCreateGroup}
                userSearch={groupSearch}
                onUserSearchChange={setGroupSearch}
                onTabChange={setActiveTab}
                onSelectRoom={handleSelectRoom}
                onSelectUser={handleSelectUser}
              />
            </div>
          )}

          {showChat && (
            <div className="flex-1 flex flex-col min-h-0">
              <ChatWindow
                room={activeRoom}
                messages={messages}
                currentUserId={user?.id}
                typingUsers={typingUsers}
                isLoading={loadingMessages}
                onSendMessage={handleSendMessage}
                onTyping={handleTypingStatus}
                isMobile
                onBack={handleBackToList}
                onOpenMembers={openMembers}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <ChatSidebar
            rooms={rooms}
            users={filteredUsers}
            activeTab={activeTab}
            activeRoomId={activeRoomId}
            loadingRooms={loadingRooms}
            loadingUsers={loadingUsers}
            canCreateGroup={isAdmin}
            onCreateGroup={handleOpenCreateGroup}
            userSearch={groupSearch}
            onUserSearchChange={setGroupSearch}
            onTabChange={setActiveTab}
            onSelectRoom={handleSelectRoom}
            onSelectUser={handleSelectUser}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Messages
                </h1>
                <p className="text-sm text-slate-500">
                  {user?.role} user - {isConnected ? "Connected" : "Offline"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                    }`}
                >
                  <SignalIcon className="w-4 h-4" />
                  {isConnected ? "Live" : "Connecting"}
                </span>
                <button
                  onClick={refreshData}
                  className="p-2 rounded-md border border-slate-200 hover:bg-slate-50"
                  aria-label="Refresh"
                >
                  <ArrowPathIcon className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            <ChatWindow
              room={activeRoom}
              messages={messages}
              currentUserId={user?.id}
              typingUsers={typingUsers}
              isLoading={loadingMessages}
              onSendMessage={handleSendMessage}
              onTyping={handleTypingStatus}
              onOpenMembers={openMembers}
            />
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Create Group
                </h3>
                <p className="text-xs text-slate-500">
                  Select users to add to the group.
                </p>
              </div>
              <button
                onClick={handleCloseCreateGroup}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <input
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                {filteredUsers.length === 0 ? (
                  <div className="text-sm text-slate-500 p-4 text-center">
                    No users found.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredUsers.map((target) => (
                      <label
                        key={target.id}
                        className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(target.id)}
                          onChange={() => toggleGroupUser(target.id)}
                          className="h-4 w-4"
                        />
                        <span className="flex-1">
                          <span className="font-medium text-slate-900">
                            {target.username}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {getBranchLabel(target.branch, target.role)}
                          </span>
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${target.isOnline
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          {target.isOnline ? "Online" : "Offline"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={handleCloseCreateGroup}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                disabled={!groupName.trim() || selectedUserIds.length < 1}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-t-xl sm:rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Group members
                </h3>
                <p className="text-xs text-slate-500">
                  {membersRoom?.name || "Chat room"}
                </p>
              </div>
              <button
                onClick={handleCloseMembers}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                aria-label="Close"
              >
                x
              </button>
            </div>
            <div className="px-5 py-4 max-h-72 overflow-y-auto">
              {membersLoading ? (
                <div className="text-sm text-slate-500 text-center py-6">
                  Loading members...
                </div>
              ) : membersRoom?.participants?.length ? (
                <div className="divide-y divide-slate-200">
                  {membersRoom.participants.map((p) => (
                    <div key={p.userId} className="py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold">
                        {(p.user?.username || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {p.user?.username || "User"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(() => {
                            const branchValue = (p.user as any)?.branch;
                            if (typeof branchValue === "string") return branchValue;
                            if (branchValue && typeof branchValue === "object") {
                              return branchValue.name || p.user?.role || "";
                            }
                            return p.user?.role || "";
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-6">
                  No members found.
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-2">
              {membersRoom?.isGroupChat && (
                <button
                  onClick={handleOpenAddMembers}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Add members
                </button>
              )}
              <button
                onClick={handleCloseMembers}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add members
                </h3>
                <p className="text-xs text-slate-500">
                  {membersRoom?.name || "Chat room"}
                </p>
              </div>
              <button
                onClick={handleCloseAddMembers}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <input
                value={addMembersSearch}
                onChange={(e) => setAddMembersSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                {eligibleAddUsers.length === 0 ? (
                  <div className="text-sm text-slate-500 p-4 text-center">
                    No users available.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {eligibleAddUsers.map((target) => (
                      <label
                        key={target.id}
                        className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAddUserIds.includes(target.id)}
                          onChange={() => toggleAddMemberUser(target.id)}
                          className="h-4 w-4"
                        />
                        <span className="flex-1">
                          <span className="font-medium text-slate-900">
                            {target.username}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {getBranchLabel(target.branch, target.role)}
                          </span>
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${target.isOnline
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          {target.isOnline ? "Online" : "Offline"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={handleCloseAddMembers}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembers}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                disabled={selectedAddUserIds.length < 1 || addingMembers}
              >
                {addingMembers ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
