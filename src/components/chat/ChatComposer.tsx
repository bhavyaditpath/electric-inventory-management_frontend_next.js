"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";

interface ChatComposerProps {
  roomId?: number | null;
  onSendMessage: (content: string, files?: File[]) => void;
  onTyping: (isTyping: boolean) => void;
  onOpenLightbox: (url: string, name: string) => void;
  maxFiles?: number;
  maxFileSizeBytes?: number;
}

export default function ChatComposer({
  roomId,
  onSendMessage,
  onTyping,
  onOpenLightbox,
  maxFiles = 10,
  maxFileSizeBytes = 10 * 1024 * 1024,
}: ChatComposerProps) {
  const totalLimitMb = Math.floor(maxFileSizeBytes / (1024 * 1024));
  const [messageInput, setMessageInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    setMessageInput("");
    setSelectedFiles([]);
    setFileWarning(null);
    setShowEmojiPicker(false);
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTypingChange = useCallback(
    (value: string) => {
      setMessageInput(value);
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 800);
    },
    [onTyping]
  );

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (emojiPickerRef.current?.contains(target)) return;
      if (emojiButtonRef.current?.contains(target)) return;
      setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [messageInput]);

  const handleSend = useCallback(() => {
    const trimmed = messageInput.trim();
    if (!roomId) return;
    if (!trimmed && selectedFiles.length === 0) return;
    onSendMessage(trimmed, selectedFiles);
    setMessageInput("");
    setSelectedFiles([]);
    setFileWarning(null);
    setShowEmojiPicker(false);
  }, [messageInput, onSendMessage, roomId, selectedFiles]);

  const handlePickFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      let warning: string | null = null;
      let skippedForType = false;
      let skippedForCount = false;
      let skippedForTotalSize = false;

      const nextFiles = [...selectedFiles];
      let totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);

      for (const file of files) {
        const isSupportedType =
          file.type.startsWith("image/") || file.type === "application/pdf";
        if (!isSupportedType) {
          skippedForType = true;
          continue;
        }

        if (nextFiles.length >= maxFiles) {
          skippedForCount = true;
          continue;
        }

        if (totalSize + file.size > maxFileSizeBytes) {
          skippedForTotalSize = true;
          continue;
        }

        nextFiles.push(file);
        totalSize += file.size;
      }

      if (skippedForTotalSize) {
        warning = `Total attachment size cannot exceed ${totalLimitMb} MB.`;
      } else if (skippedForCount) {
        warning = "You can attach up to 10 files per message.";
      } else if (skippedForType) {
        warning = "Only images and PDFs are allowed.";
      }

      setFileWarning(warning);
      setSelectedFiles(nextFiles);
      event.target.value = "";
    },
    [maxFileSizeBytes, maxFiles, selectedFiles, totalLimitMb]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData) => {
      const textarea = messageInputRef.current;
      const start = textarea?.selectionStart ?? messageInput.length;
      const end = textarea?.selectionEnd ?? messageInput.length;
      const nextValue = `${messageInput.slice(0, start)}${emojiData.emoji}${messageInput.slice(end)}`;
      handleTypingChange(nextValue);

      requestAnimationFrame(() => {
        const input = messageInputRef.current;
        if (!input) return;
        const cursor = start + emojiData.emoji.length;
        input.focus();
        input.setSelectionRange(cursor, cursor);
      });
    },
    [handleTypingChange, messageInput]
  );

  const previewFiles = useMemo(
    () =>
      selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previewFiles.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [previewFiles]);

  return (
    <div className="sticky bottom-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]">
      {previewFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {previewFiles.map((file, index) => (
            <div
              key={file.id}
              className="relative border border-[var(--theme-border)] rounded-lg overflow-hidden bg-[var(--theme-surface-muted)] shadow-sm"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-20 w-20 object-cover cursor-pointer"
                  onClick={() => onOpenLightbox(file.url, file.name)}
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center text-xs text-[var(--theme-text-muted)]">
                  PDF
                </div>
              )}
              <button
                onClick={() => handleRemoveFile(index)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-[var(--theme-surface)] text-[var(--theme-text-muted)] text-xs hover:bg-[var(--theme-surface-muted)] cursor-pointer"
                aria-label="Remove file"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />
        <button
          onClick={handlePickFiles}
          className="p-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
          aria-label="Attach files"
        >
          <PaperClipIcon className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer"
            aria-label="Open emoji picker"
          >
            <FaceSmileIcon className="w-4 h-4" />
          </button>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-12 left-0 z-20 shadow-xl rounded-xl overflow-hidden"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                lazyLoadEmojis
                width={300}
                height={360}
              />
            </div>
          )}
        </div>
        <textarea
          ref={messageInputRef}
          value={messageInput}
          onChange={(e) => handleTypingChange(e.target.value)}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 border border-[var(--theme-border)] rounded-2xl px-4 py-2 text-sm bg-[var(--theme-surface-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--theme-text)] resize-none overflow-y-auto max-h-[120px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        />
        <button
          onClick={handleSend}
          className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 text-[11px] text-[var(--theme-text-muted)] flex flex-wrap items-center gap-2">
        <span>Max 10 files per message.</span>
        <span>Total attachment size up to {totalLimitMb} MB.</span>
        <span>Images and PDFs only.</span>
        {fileWarning && <span className="text-amber-600">{fileWarning}</span>}
      </div>
    </div>
  );
}

