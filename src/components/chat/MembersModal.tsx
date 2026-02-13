"use client";

import { ChatRoom } from "@/types/chat.types";

interface MembersModalProps {
  isOpen: boolean;
  room: ChatRoom | null;
  isLoading: boolean;
  currentUserId?: number;
  onRequestRemove?: (userId: number) => void;
  onClose: () => void;
  onOpenAddMembers: () => void;
}

export default function MembersModal({
  isOpen,
  room,
  isLoading,
  currentUserId,
  onRequestRemove,
  onClose,
  onOpenAddMembers,
}: MembersModalProps) {
  if (!isOpen) return null;
  const isGroupAdmin = !!room && room.createdBy === currentUserId;
  const canLeaveGroup =
    !!room?.isGroupChat &&
    !!currentUserId &&
    !!room?.participants?.some((p) => p.userId === currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[var(--theme-border)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-text)]">
              Group members
            </h3>
            <p className="text-xs text-[var(--theme-text-muted)]">
              {room?.name || "Chat room"}
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
        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-[var(--theme-text-muted)] text-center py-6">
              Loading members...
            </div>
          ) : room?.participants?.length ? (
            <div className="divide-y divide-[var(--theme-border)]">
              {room.participants.map((p) => (
                <div key={p.userId} className="py-3 px-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)] flex items-center justify-center text-sm font-semibold">
                    {(p.user?.username || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--theme-text)]">
                      {p.user?.username || "User"}
                    </p>
                    <p className="text-xs text-[var(--theme-text-muted)]">
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
                  {(room.createdBy
                    ? room.createdBy === p.userId
                    : (p.user?.role || "").toLowerCase() === "admin") && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  {isGroupAdmin &&
                    p.userId !== currentUserId &&
                    room.isGroupChat && (
                      <button
                        onClick={() => onRequestRemove?.(p.userId)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--theme-text-muted)] text-center py-6">
              No members found.
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-[var(--theme-border)] flex items-center justify-between gap-2">
          {room?.isGroupChat && (
            <button
              onClick={onOpenAddMembers}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              Add members
            </button>
          )}
          {canLeaveGroup && (
            <button
              onClick={() => onRequestRemove?.(currentUserId!)}
              className="px-4 py-2 rounded-lg border border-rose-200 text-sm text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              Leave group
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
