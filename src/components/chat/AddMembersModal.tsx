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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-[var(--theme-surface)] rounded-2xl shadow-2xl border border-[var(--theme-border)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-text)]">
              Add members
            </h3>
            <p className="text-xs text-[var(--theme-text-muted)]">
              {roomName || "Chat room"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)] cursor-pointer"
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
            className="w-full border border-[var(--theme-border)] rounded-lg px-3 py-2 text-sm bg-[var(--theme-surface-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--theme-text)]"
          />
          <div className="max-h-60 overflow-y-auto border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface)]">
            {eligibleUsers.length === 0 ? (
              <div className="text-sm text-[var(--theme-text-muted)] p-4 text-center">
                No users available.
              </div>
            ) : (
              <div className="divide-y divide-[var(--theme-border)]">
                {eligibleUsers.map((target) => (
                  <label
                    key={target.id}
                    className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-[var(--theme-surface-muted)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(target.id)}
                      onChange={() => onToggleUser(target.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1">
                      <span className="font-medium text-[var(--theme-text)]">
                        {target.username}
                      </span>
                      <span className="block text-xs text-[var(--theme-text-muted)]">
                        {getBranchLabel(target.branch, target.role)}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        target.isOnline
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)]"
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

        <div className="px-5 py-4 border-t border-[var(--theme-border)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 shadow-sm cursor-pointer"
            disabled={selectedUserIds.length < 1 || addingMembers}
          >
            {addingMembers ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

