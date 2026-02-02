'use client';

import { useState, useEffect } from 'react';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import NewChatModal from '@/components/chat/NewChatModal';
import { UserRole } from '@/types/enums';
import toast from 'react-hot-toast';

function AdminChatContent() {
  const { user } = useAuth();
  const {
    rooms,
    activeRoom,
    messages,
    typingUsers,
    loading,
    error,
    hasMoreMessages,
    sendMessage,
    loadMessages,
    loadMoreMessages,
    selectRoom,
    startDirectChat,
    createRoom,
    setTyping,
  } = useChat();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load rooms on mount
  useEffect(() => {
    if (user && user.role === UserRole.ADMIN) {
      // Rooms are loaded via ChatProvider
    }
  }, [user]);

  const handleSelectRoom = async (roomId: string) => {
    await selectRoom(roomId);
  };

  const handleSendMessage = async (
    content: string,
    type?: 'text' | 'image' | 'file',
    attachmentUrl?: string
  ) => {
    await sendMessage(content, type, attachmentUrl);
  };

  const handleStartChat = async (userId: string) => {
    try {
      const room = await startDirectChat(userId);
      if (room) {
        toast.success('Chat started');
      }
    } catch (error) {
      toast.error('Failed to start chat');
    }
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    try {
      const room = await createRoom(name, participantIds, 'group');
      if (room) {
        toast.success('Group created');
      }
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Chat List - Hidden on mobile when chat is open */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${
          isMobileView && activeRoom ? 'hidden' : 'block'
        }`}
      >
        <ChatList
          rooms={rooms}
          activeRoomId={activeRoom?.id}
          onSelectRoom={handleSelectRoom}
          onCreateNewChat={() => setShowNewChatModal(true)}
          loading={loading}
        />
      </div>

      {/* Chat Window - Full width on mobile when open */}
      <div
        className={`flex-1 ${
          isMobileView && !activeRoom ? 'hidden' : 'block'
        }`}
      >
        <ChatWindow
          room={activeRoom}
          messages={messages}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onLoadMore={loadMoreMessages}
          hasMoreMessages={hasMoreMessages}
          loading={loading}
          isMobile={isMobileView}
          onBack={() => selectRoom('')}
        />
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartChat={handleStartChat}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <ChatProvider>
      <AdminChatContent />
    </ChatProvider>
  );
}
