"use client";

import { ChatUser } from "@/types/chat.types";

interface AddMembersModalProps {
  isOpen: boolean;
  roomName?: string | null;
  search: string;
  eligibleUsers: ChatUser[];
  selectedUserIds: number[];
  getBranchLabel: (value: unknown, fallback?: string) => string;
  addingMembers: boolean;
  onChangeSearch: (value: string) => void;
  onToggleUser: (userId: number) => void;
  onClose: () => void;
  onAdd: () => void;
}

export default function AddMembersModal({
  isOpen,
  roomName,
  search,
  eligibleUsers,
  selectedUserIds,
  getBranchLabel,
  addingMembers,
  onChangeSearch,
  onToggleUser,
  onClose,
  onAdd,
}: AddMembersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-5 py-2 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Add members
            </h3>
            <p className="text-xs text-slate-500">
              {roomName || "Chat room"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <input
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
            {eligibleUsers.length === 0 ? (
              <div className="text-sm text-slate-500 p-4 text-center">
                No users available.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {eligibleUsers.map((target) => (
                  <label
                    key={target.id}
                    className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(target.id)}
                      onChange={() => onToggleUser(target.id)}
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
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        target.isOnline
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
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            disabled={selectedUserIds.length < 1 || addingMembers}
          >
            {addingMembers ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
