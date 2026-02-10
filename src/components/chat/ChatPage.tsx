"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/Services/chat.api";
import { showError, showSuccess } from "@/Services/toast.service";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/enums";
import { ChatMessage, ChatRoom, ChatUser } from "@/types/chat.types";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { ArrowPathIcon, SignalIcon } from "@heroicons/react/24/outline";
import CreateGroupModal from "./CreateGroupModal";
import MembersModal from "./MembersModal";
import AddMembersModal from "./AddMembersModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import RemoveParticipantModal from "./RemoveParticipantModal";
import { useCallWebSocket } from "@/hooks/useCallWebSocket";
import CallOverlay from "./CallOverlay";
import { CallState } from "@/types/enums";
import { CallType } from "@/types/enums";
import CallLogsModal from "./CallLogsModal";

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
  const [removeParticipant, setRemoveParticipant] = useState<{
    userId: number;
  } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [newAdminId, setNewAdminId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "room" | "message";
    id: number;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // ===== CALL STATE =====
  const [incomingCall, setIncomingCall] = useState<number | null>(null);
  const [callingUserId, setCallingUserId] = useState<number | null>(null);
  const [callKind, setCallKind] = useState<CallType | null>(null);
  const [incomingCallerName, setIncomingCallerName] = useState<string | null>(null);
  const [showCallLogs, setShowCallLogs] = useState(false);
  const [callLogsTab, setCallLogsTab] = useState<"history" | "missed" | "room">("history");
  const [callLogsType, setCallLogsType] = useState<"all" | CallType>("all");
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
        if (response.message) showError(response.message);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]);
      showError("Failed to fetch rooms");
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
        if (response.message) showError(response.message);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
      showError("Failed to fetch users");
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
      const next = prev.map((room) => {
        if (room.id !== message.chatRoomId) return room;
        const unreadCount =
          currentRoomId === room.id ? 0 : (room.unreadCount || 0) + 1;
        return { ...room, lastMessage: message, unreadCount };
      });
      return sortRooms(next);
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
    onMessageDeleted: (payload) => {
      setMessages((prev) => prev.filter((m) => m.id !== payload.id));
      setRooms((prev) =>
        prev.map((room) =>
          room.id === payload.chatRoomId
            ? { ...room, lastMessage: null }
            : room
        )
      );
      fetchRooms();
    },
    onTyping: handleTyping,
    onUserOnline: handleUserOnline,
    onUserOffline: handleUserOffline,
  });

  const {
    callState,
    callerId,
    callerName,
    incomingCallType,
    connectedAt,
    callUser,
    acceptCall,
    rejectCall,
    endCall,
  } = useCallWebSocket();

  // ================= CALL STATE LISTENER =================
  useEffect(() => {
    // someone is calling me
    if (callState === CallState.Ringing && callerId) {
      setIncomingCall(callerId);
      setIncomingCallerName(callerName ?? null);
      if (incomingCallType) setCallKind(incomingCallType);
    }

    // call connected
    if (callState === CallState.Connected) {
      setIncomingCall(null);
      setCallingUserId(null);
    }

    // call ended / rejected / cancelled
    if (callState === CallState.Idle) {
      setIncomingCall(null);
      setCallingUserId(null);
      setCallKind(null);
      setIncomingCallerName(null);
    }
  }, [callState, callerId, callerName, incomingCallType]);



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
          if (response.message) showError(response.message);
        }

        const roomResponse = await chatApi.getRoom(activeRoomId);
        if (roomResponse.success && roomResponse.data) {
          setRooms((prev) =>
            prev.map((room) =>
              room.id === activeRoomId ? { ...room, ...roomResponse.data } : room
            )
          );
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
        showError("Failed to fetch messages");
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
  const handleStartCall = useCallback((userId: number, kind: CallType) => {
    if (!activeRoomId) return;
    setCallKind(kind);
    setCallingUserId(userId);
    callUser(userId, activeRoomId, kind);
  }, [activeRoomId, callUser]);

  const handleAcceptCall = useCallback(() => {
    acceptCall();
    setIncomingCall(null);
  }, [acceptCall]);

  const handleRejectCall = useCallback(() => {
    rejectCall();
    setIncomingCall(null);
  }, [rejectCall]);

  const handleEndCall = useCallback(() => {
    endCall();
  }, [endCall]);

  const handleOpenCallLogs = useCallback((options?: { tab?: "history" | "missed" | "room"; type?: "all" | CallType }) => {
    if (options?.tab) setCallLogsTab(options.tab);
    if (options?.type) setCallLogsType(options.type);
    setShowCallLogs(true);
  }, []);

  const handleCloseCallLogs = useCallback(() => {
    setShowCallLogs(false);
  }, []);


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
        } else if (response.message) {
          showError(response.message);
        }
      } catch (error) {
        console.error("Failed to start chat:", error);
        showError("Failed to start chat");
      }
    },
    [isMobile]
  );

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!activeRoomId) return;
      const trimmed = content.trim();
      const hasFiles = !!files && files.length > 0;
      if (!trimmed && !hasFiles) return;

      if (isConnected && !hasFiles) {
        sendMessage(activeRoomId, trimmed);
        return;
      }

      try {
        const response = await chatApi.sendMessage(
          { chatRoomId: activeRoomId, content: trimmed },
          files
        );
        if (response.success && response.data) {
          handleIncomingMessage(response.data);
        } else if (response.message) {
          showError(response.message);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        showError("Failed to send message");
      }
    },
    [activeRoomId, handleIncomingMessage, isConnected, sendMessage]
  );

  const sortRooms = useCallback((list: ChatRoom[]) => {
    return [...list].sort((a, b) => {
      const ap = a.pinned ? 0 : 1;
      const bp = b.pinned ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const aHasMessage = !!a.lastMessage;
      const bHasMessage = !!b.lastMessage;
      if (aHasMessage !== bHasMessage) return aHasMessage ? -1 : 1;
      if (aHasMessage && bHasMessage) {
        const aTime = Date.parse(a.lastMessage!.createdAt);
        const bTime = Date.parse(b.lastMessage!.createdAt);
        if (aTime !== bTime) return bTime - aTime;
      }
      const ad = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bd = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (ad !== bd) return bd - ad;
      return b.id - a.id;
    });
  }, []);

  const handlePinRoom = useCallback(
    async (roomId: number, pinned: boolean) => {
      try {
        const response = await chatApi.pinRoom(roomId, { pinned });
        if (response.success) {
          setRooms((prev) =>
            sortRooms(
              prev.map((room) =>
                room.id === roomId ? { ...room, pinned } : room
              )
            )
          );
        } else if (response.message) {
          showError(response.message);
        }
      } catch (error) {
        console.error("Failed to update pin:", error);
        showError("Failed to update pin");
      }
    },
    [sortRooms]
  );

  const handleDeleteRoom = useCallback(
    async (roomId: number) => {
      setDeleteLoading(true);
      try {
        const response = await chatApi.deleteRoom(roomId);
        if (response.success) {
          setRooms((prev) => prev.filter((room) => room.id !== roomId));
          if (activeRoomId === roomId) {
            setActiveRoomId(null);
            setMessages([]);
          }
        } else if (response.message) {
          showError(response.message);
        }
      } catch (error) {
        console.error("Failed to delete room:", error);
        showError("Failed to delete room");
      } finally {
        setDeleteLoading(false);
      }
    },
    [activeRoomId]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: number) => {
      setDeleteLoading(true);
      try {
        const response = await chatApi.deleteMessage(messageId);
        if (response.success) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          fetchRooms();
        } else if (response.message) {
          showError(response.message);
        }
      } catch (error) {
        console.error("Failed to delete message:", error);
        showError("Failed to delete message");
      } finally {
        setDeleteLoading(false);
      }
    },
    [fetchRooms]
  );

  const requestDeleteRoom = useCallback((roomId: number) => {
    setConfirmDelete({ type: "room", id: roomId });
  }, []);

  const requestDeleteMessage = useCallback((messageId: number) => {
    setConfirmDelete({ type: "message", id: messageId });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "room") {
      await handleDeleteRoom(confirmDelete.id);
    } else {
      await handleDeleteMessage(confirmDelete.id);
    }
    setConfirmDelete(null);
  }, [confirmDelete, handleDeleteMessage, handleDeleteRoom]);

  const handleCloseDelete = useCallback(() => {
    if (deleteLoading) return;
    setConfirmDelete(null);
  }, [deleteLoading]);

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
    setRemoveParticipant(null);
    setNewAdminId(null);
  }, []);

  const requestRemoveParticipant = useCallback((userId: number) => {
    setRemoveParticipant({ userId });
    setNewAdminId(null);
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
      } else if (response.message) {
        showError(response.message);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      showError("Failed to create group");
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
      } else if (response.message) {
        showError(response.message);
      }
      handleCloseAddMembers();
    } catch (error) {
      console.error("Failed to add participants:", error);
      showError("Failed to add participants");
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
        if (response.message) showError(response.message);
      }
    } catch (error) {
      console.error("Failed to load group members:", error);
      setMembersRoom(null);
      showError("Failed to load group members");
    } finally {
      setMembersLoading(false);
    }
  }, [activeRoomId]);

  const handleRemoveParticipant = useCallback(async () => {
    if (!activeRoomId || !removeParticipant || !user?.id) return;
    const removingSelf = removeParticipant.userId === user.id;
    const isGroupAdmin = membersRoom?.createdBy === user.id;
    const adminRemovingSelf = removingSelf && isGroupAdmin;
    const participantCount = membersRoom?.participants?.length || 0;

    if (adminRemovingSelf && !newAdminId) {
      showError("Admin must transfer admin role before leaving");
      return;
    }

    if (adminRemovingSelf && participantCount <= 1) {
      showError("Cannot leave the group as the only member.");
      return;
    }

    setRemoveLoading(true);
    try {
      const payload: { userId?: number; newAdminId?: number } = {
        userId: removeParticipant.userId,
      };
      if (adminRemovingSelf && newAdminId) {
        payload.newAdminId = newAdminId;
      }

      const response = await chatApi.removeParticipant(activeRoomId, payload);
      if (response.success) {
        if (response.message) {
          showSuccess(response.message);
        } else {
          showSuccess(removingSelf ? "Left the group" : "Participant removed");
        }
        if (removingSelf) {
          setRooms((prev) => prev.filter((room) => room.id !== activeRoomId));
          if (activeRoomId === activeRoomIdRef.current) {
            setActiveRoomId(null);
            setMessages([]);
          }
          setShowMembers(false);
          setMembersRoom(null);
        } else {
          const refreshed = await chatApi.getRoom(activeRoomId);
          if (refreshed.success && refreshed.data) {
            setMembersRoom(refreshed.data);
          }
          fetchRooms();
        }
        setRemoveParticipant(null);
        setNewAdminId(null);
      } else if (response.message) {
        showError(response.message);
      } else {
        showError("Failed to remove participant");
      }
    } catch (error) {
      console.error("Failed to remove participant:", error);
      showError("Failed to remove participant");
    } finally {
      setRemoveLoading(false);
    }
  }, [activeRoomId, fetchRooms, membersRoom?.createdBy, newAdminId, removeParticipant, user?.id]);

  const handleCloseRemove = useCallback(() => {
    if (removeLoading) return;
    setRemoveParticipant(null);
    setNewAdminId(null);
  }, [removeLoading]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const typingUsers = useMemo(
    () => users.filter((u) => typingUserIds.includes(u.id)),
    [users, typingUserIds]
  );

  const isAdmin = user?.role === UserRole.ADMIN;
  const removingSelf = removeParticipant?.userId === user?.id;
  const adminRemovingSelf =
    removingSelf && membersRoom?.createdBy === user?.id;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100/60">
      {isMobile ? (
        <div className="flex-1 flex flex-col min-h-0">
          {!showChat && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-slate-200 bg-white/95 flex items-center justify-between">
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
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
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
                onPinRoom={handlePinRoom}
                onDeleteRoom={requestDeleteRoom}
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
                isAdmin={isAdmin}
                onSendMessage={handleSendMessage}
                onTyping={handleTypingStatus}
                isMobile
                onBack={handleBackToList}
                onOpenMembers={openMembers}
                onDeleteMessage={requestDeleteMessage}
                onStartCall={handleStartCall}
                callState={callState}
                onEndCall={handleEndCall}
                onAcceptCall={handleAcceptCall}
                onRejectCall={handleRejectCall}
                incomingCall={incomingCall}
                onOpenCallLogs={handleOpenCallLogs}
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
            onPinRoom={handlePinRoom}
            onDeleteRoom={requestDeleteRoom}
          />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-5 py-3 border-b border-slate-200 bg-white/95 flex items-center justify-between">
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
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
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
              isAdmin={isAdmin}
              onSendMessage={handleSendMessage}
              onTyping={handleTypingStatus}
              onOpenMembers={openMembers}
              onDeleteMessage={requestDeleteMessage}
              onStartCall={handleStartCall}
              callState={callState}
              onEndCall={handleEndCall}
              onAcceptCall={handleAcceptCall}
              onRejectCall={handleRejectCall}
              incomingCall={incomingCall}
              onOpenCallLogs={handleOpenCallLogs}
            />
          </div>
        </div>
      )}

      <CreateGroupModal
        isOpen={showCreateGroup}
        groupName={groupName}
        groupSearch={groupSearch}
        filteredUsers={filteredUsers}
        selectedUserIds={selectedUserIds}
        getBranchLabel={getBranchLabel}
        onChangeGroupName={setGroupName}
        onChangeSearch={setGroupSearch}
        onToggleUser={toggleGroupUser}
        onClose={handleCloseCreateGroup}
        onCreate={handleCreateGroup}
      />

      <MembersModal
        isOpen={showMembers && !removeParticipant}
        room={membersRoom}
        isLoading={membersLoading}
        currentUserId={user?.id}
        onRequestRemove={requestRemoveParticipant}
        onClose={handleCloseMembers}
        onOpenAddMembers={handleOpenAddMembers}
      />

      <AddMembersModal
        isOpen={showAddMembers}
        roomName={membersRoom?.name}
        search={addMembersSearch}
        eligibleUsers={eligibleAddUsers}
        selectedUserIds={selectedAddUserIds}
        getBranchLabel={getBranchLabel}
        addingMembers={addingMembers}
        onChangeSearch={setAddMembersSearch}
        onToggleUser={toggleAddMemberUser}
        onClose={handleCloseAddMembers}
        onAdd={handleAddMembers}
      />

      <ConfirmDeleteModal
        isOpen={!!confirmDelete}
        title={
          confirmDelete?.type === "room"
            ? "Delete chat room"
            : "Delete message"
        }
        description={
          confirmDelete?.type === "room"
            ? "This will permanently delete the chat room and its messages."
            : "This will permanently delete the selected message."
        }
        confirmLabel="Delete"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
      />

      <RemoveParticipantModal
        isOpen={!!removeParticipant}
        title={
          adminRemovingSelf
            ? "Transfer admin and leave"
            : removingSelf
              ? "Leave group"
              : "Remove participant"
        }
        description={
          adminRemovingSelf
            ? "Select a new admin before leaving this group."
            : removingSelf
              ? "You will be removed from this group."
              : "This member will be removed from the group."
        }
        confirmLabel={adminRemovingSelf ? "Transfer & Leave" : "Remove"}
        isLoading={removeLoading}
        showAdminTransfer={!!adminRemovingSelf}
        participants={membersRoom?.participants || []}
        currentUserId={user?.id}
        newAdminId={newAdminId}
        onChangeNewAdminId={setNewAdminId}
        onConfirm={handleRemoveParticipant}
        onClose={handleCloseRemove}
      />

      <CallOverlay
        visible={callState !== CallState.Idle}
        state={callState}
        userId={incomingCall ?? callingUserId}
        displayName={incomingCallerName ?? undefined}
        incoming={callState === CallState.Ringing}
        callKind={callKind}
        connectedAt={connectedAt}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
      />

      <CallLogsModal
        isOpen={showCallLogs}
        onClose={handleCloseCallLogs}
        roomId={activeRoom?.id}
        initialTab={callLogsTab}
        initialType={callLogsType}
      />

    </div>
  );
}
