"use client";

interface RenameRoomModalProps {
  isOpen: boolean;
  roomName: string;
  isLoading?: boolean;
  onChangeRoomName: (value: string) => void;
  onClose: () => void;
  onRename: () => void;
}

export default function RenameRoomModal({
  isOpen,
  roomName,
  isLoading,
  onChangeRoomName,
  onClose,
  onRename,
}: RenameRoomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-2xl shadow-2xl border border-[var(--theme-border)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-text)]">
              Rename Group
            </h3>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Update your group chat name.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)] cursor-pointer disabled:cursor-not-allowed"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="px-5 py-4">
          <input
            value={roomName}
            onChange={(e) => onChangeRoomName(e.target.value)}
            placeholder="Group name"
            className="w-full border border-[var(--theme-border)] rounded-lg px-3 py-2 text-sm bg-[var(--theme-surface-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--theme-text)]"
            maxLength={100}
          />
        </div>

        <div className="px-5 py-4 border-t border-[var(--theme-border)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onRename}
            disabled={isLoading || !roomName.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
