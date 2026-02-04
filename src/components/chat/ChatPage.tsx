"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/Services/chat.api";
import { useAuth } from "@/contexts/AuthContext";
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
  const joinedRoomRef = useRef<number | null>(null);
  const activeRoomIdRef = useRef<number | null>(null);
  const typingTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

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
      }, 1500);
      typingTimersRef.current.set(payload.userId, timeout);
    }
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

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const typingUsers = useMemo(
    () => users.filter((u) => typingUserIds.includes(u.id)),
    [users, typingUserIds]
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {isMobile ? (
        <div className="flex-1 flex flex-col">
          {!showChat && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Messages
                  </h1>
                  <p className="text-xs text-slate-500">
                    {user?.role} user · {isConnected ? "Connected" : "Offline"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    fetchRooms();
                    fetchUsers();
                  }}
                  className="p-2 rounded-md border border-slate-200 hover:bg-slate-50"
                  aria-label="Refresh"
                >
                  <ArrowPathIcon className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <ChatSidebar
                rooms={rooms}
                users={users}
                activeTab={activeTab}
                activeRoomId={activeRoomId}
                loadingRooms={loadingRooms}
                loadingUsers={loadingUsers}
                onTabChange={setActiveTab}
                onSelectRoom={handleSelectRoom}
                onSelectUser={handleSelectUser}
              />
            </div>
          )}

          {showChat && (
            <div className="flex-1 flex flex-col">
              <ChatWindow
                room={activeRoom}
                messages={messages}
                currentUserId={user?.id}
                typingUsers={typingUsers}
                isLoading={loadingMessages}
                onSendMessage={handleSendMessage}
                onTyping={handleTypingStatus}
                isMobile
                onBack={() => setShowChat(false)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1">
          <ChatSidebar
            rooms={rooms}
            users={users}
            activeTab={activeTab}
            activeRoomId={activeRoomId}
            loadingRooms={loadingRooms}
            loadingUsers={loadingUsers}
            onTabChange={setActiveTab}
            onSelectRoom={handleSelectRoom}
            onSelectUser={handleSelectUser}
          />

          <div className="flex-1 flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Messages
                </h1>
                <p className="text-sm text-slate-500">
                  {user?.role} user · {isConnected ? "Connected" : "Offline"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <SignalIcon className="w-4 h-4" />
                  {isConnected ? "Live" : "Connecting"}
                </span>
                <button
                  onClick={() => {
                    fetchRooms();
                    fetchUsers();
                  }}
                  className=" rounded-md border border-slate-200 hover:bg-slate-50"
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
