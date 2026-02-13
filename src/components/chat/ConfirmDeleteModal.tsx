"use client";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-2xl shadow-2xl border border-[var(--theme-border)] overflow-hidden">
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
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

