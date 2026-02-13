"use client";

import { ChatRoomParticipant } from "@/types/chat.types";

interface RemoveParticipantModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  showAdminTransfer: boolean;
  participants: ChatRoomParticipant[];
  currentUserId?: number;
  newAdminId: number | null;
  onChangeNewAdminId: (value: number | null) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function RemoveParticipantModal({
  isOpen,
  title,
  description,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  isLoading = false,
  showAdminTransfer,
  participants,
  currentUserId,
  newAdminId,
  onChangeNewAdminId,
  onConfirm,
  onClose,
}: RemoveParticipantModalProps) {
  if (!isOpen) return null;

  const eligibleAdmins = participants.filter(
    (p) => p.userId !== currentUserId
  );
  const disableConfirm =
    isLoading ||
    (showAdminTransfer && (!newAdminId || eligibleAdmins.length === 0));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[85vh] bg-[var(--theme-surface)] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[var(--theme-border)] overflow-y-auto">
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-text)]">{title}</h3>
            <p className="text-xs text-[var(--theme-text-muted)]">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)] cursor-pointer"
            aria-label="Close"
            disabled={isLoading}
          >
            x
          </button>
        </div>
        {showAdminTransfer && (
          <div className="px-5 py-3">
            <label className="block text-xs font-medium text-[var(--theme-text-muted)] mb-2">
              Select new admin
            </label>
            <select
              value={newAdminId ?? ""}
              onChange={(e) =>
                onChangeNewAdminId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full border border-[var(--theme-border)] rounded-lg px-3 py-2 text-sm bg-[var(--theme-surface-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--theme-text)]"
              disabled={isLoading}
            >
              <option value="">Choose a member</option>
              {eligibleAdmins.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.user?.username || `User ${p.userId}`}
                </option>
              ))}
            </select>
            {eligibleAdmins.length === 0 && (
              <p className="text-xs text-rose-600 mt-2">
                No other members available to assign as admin.
              </p>
            )}
          </div>
        )}
        <div className="px-5 py-2 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 shadow-sm cursor-pointer"
            disabled={disableConfirm}
          >
            {isLoading ? "Removing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

