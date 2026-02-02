'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '@/types/chat.types';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => Promise<void>;
  onCreateGroup?: (name: string, participantIds: string[]) => Promise<void>;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onStartChat,
  onCreateGroup,
}: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [showGroupMode, setShowGroupMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery('');
      setSelectedUsers([]);
      setGroupName('');
      setShowGroupMode(false);
    }
  }, [isOpen]);

  // Simulated users - replace with actual API call
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      // This would be replaced with actual API call
      // const users = await searchUsers(searchQuery);
      // setUsers(users);
      setLoading(false);
    };

    if (searchQuery) {
      fetchUsers();
    }
  }, [searchQuery]);

  const handleUserSelect = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleStartChat = async () => {
    if (showGroupMode) {
      if (selectedUsers.length >= 2 && groupName.trim()) {
        await onCreateGroup?.(groupName, selectedUsers.map((u) => u.id));
      }
    } else {
      const user = selectedUsers[0];
      if (user) {
        await onStartChat(user.id);
      }
    }
    onClose();
  };

  const canProceed = showGroupMode
    ? selectedUsers.length >= 2 && groupName.trim()
    : selectedUsers.length === 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowGroupMode(false);
                setSelectedUsers([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !showGroupMode
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              New Chat
            </button>
            <button
              onClick={() => {
                setShowGroupMode(true);
                setSelectedUsers([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showGroupMode
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              New Group
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search ${showGroupMode ? 'users' : 'users to chat with'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Group name input */}
        {showGroupMode && (
          <div className="p-4 border-b border-slate-200">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black placeholder:text-slate-400"
            />
          </div>
        )}

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm"
                >
                  <span>{user.username}</span>
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="hover:text-blue-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Sample users - replace with actual data */}
              {([
                { id: '1', username: 'John Doe', role: 'admin' as const },
                { id: '2', username: 'Jane Smith', role: 'branch' as const },
                { id: '3', username: 'Bob Wilson', role: 'branch' as const },
              ] as User[])
                .filter((user) =>
                  user.username.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((user) => {
                  const isSelected = selectedUsers.find((u) => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-900">{user.username}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartChat}
            disabled={!canProceed}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlusIcon className="w-4 h-4" />
            {showGroupMode ? 'Create Group' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}

