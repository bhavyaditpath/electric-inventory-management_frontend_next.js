"use client";

import { ChatRoom } from "@/types/chat.types";

interface MembersModalProps {
  isOpen: boolean;
  room: ChatRoom | null;
  isLoading: boolean;
  onClose: () => void;
  onOpenAddMembers: () => void;
}

export default function MembersModal({
  isOpen,
  room,
  isLoading,
  onClose,
  onOpenAddMembers,
}: MembersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-t-xl sm:rounded-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Group members
            </h3>
            <p className="text-xs text-slate-500">
              {room?.name || "Chat room"}
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
        <div className="px-5 py-4 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-slate-500 text-center py-6">
              Loading members...
            </div>
          ) : room?.participants?.length ? (
            <div className="divide-y divide-slate-200">
              {room.participants.map((p) => (
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
          {room?.isGroupChat && (
            <button
              onClick={onOpenAddMembers}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer"
            >
              Add members
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
