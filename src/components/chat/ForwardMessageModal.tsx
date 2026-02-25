"use client";

import { useMemo, useState } from "react";
import { ChatMessage, ChatRoom } from "@/types/chat.types";

interface ForwardMessageModalProps {
  isOpen: boolean;
  sourceMessage: ChatMessage | null;
  rooms: ChatRoom[];
  currentRoomId?: number | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (targetRoomIds: number[], note: string) => Promise<void>;
}

export default function ForwardMessageModal({
  isOpen,
  sourceMessage,
  rooms,
  currentRoomId,
  isLoading = false,
  onClose,
  onConfirm,
}: ForwardMessageModalProps) {
  const [search, setSearch] = useState("");
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>(
    currentRoomId ? [currentRoomId] : []
  );
  const [note, setNote] = useState("");

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((room) => room.name.toLowerCase().includes(q));
  }, [rooms, search]);

  const sourcePreview = useMemo(() => {
    if (!sourceMessage) return "";
    const text = sourceMessage.content?.trim();
    if (text) return text;
    const attachmentCount = sourceMessage.attachments?.length || 0;
    if (attachmentCount > 0) {
      return attachmentCount === 1 ? "Attachment" : `${attachmentCount} attachments`;
    }
    if (sourceMessage.forwardedFrom?.contentPreview) {
      return sourceMessage.forwardedFrom.contentPreview;
    }
    return "(no text)";
  }, [sourceMessage]);

  const toggleRoom = (roomId: number) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleForward = async () => {
    if (selectedRoomIds.length === 0 || isLoading) return;
    await onConfirm(selectedRoomIds, note.trim());
  };

  if (!isOpen || !sourceMessage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-[var(--theme-surface)] rounded-2xl shadow-2xl border border-[var(--theme-border)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-text)]">
              Forward this message
            </h3>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Select one or more chats and add an optional note.
            </p>
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

        <div className="px-5 py-4 space-y-3">
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-3 py-2">
            <p className="text-[11px] font-semibold text-[var(--theme-text-muted)]">
              Source message
            </p>
            <p className="text-xs text-[var(--theme-text)] break-words">
              {sourcePreview}
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats..."
            className="w-full border border-[var(--theme-border)] rounded-lg px-3 py-2 text-sm bg-[var(--theme-surface-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--theme-text)]"
          />

          <div className="max-h-56 overflow-y-auto border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface)]">
            {filteredRooms.length === 0 ? (
              <div className="text-sm text-[var(--theme-text-muted)] p-4 text-center">
                No chats found.
              </div>
            ) : (
              <div className="divide-y divide-[var(--theme-border)]">
                {filteredRooms.map((room) => (
                  <label
                    key={room.id}
                    className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-[var(--theme-surface-muted)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoomIds.includes(room.id)}
                      onChange={() => toggleRoom(room.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-[var(--theme-text)] truncate block">
                        {room.name}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a message (optional)"
            rows={3}
            className="w-full border border-[var(--theme-border)] rounded-lg px-3 py-2 text-sm bg-[var(--theme-surface-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--theme-text)] resize-none"
          />
        </div>

        <div className="px-5 py-4 border-t border-[var(--theme-border)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleForward()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-60"
            disabled={isLoading || selectedRoomIds.length === 0}
          >
            {isLoading ? "Forwarding..." : "Forward"}
          </button>
        </div>
      </div>
    </div>
  );
}
