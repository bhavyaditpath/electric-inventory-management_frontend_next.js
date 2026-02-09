"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/outline";

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
  const [messageInput, setMessageInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMessageInput("");
    setSelectedFiles([]);
    setFileWarning(null);
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

  const handleSend = useCallback(() => {
    const trimmed = messageInput.trim();
    if (!roomId) return;
    if (!trimmed && selectedFiles.length === 0) return;
    onSendMessage(trimmed, selectedFiles);
    setMessageInput("");
    setSelectedFiles([]);
    setFileWarning(null);
  }, [messageInput, onSendMessage, roomId, selectedFiles]);

  const handlePickFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      setFileWarning(null);
      const filtered = files.filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.type === "application/pdf"
      );
      const sizeOk = filtered.filter((file) => file.size <= maxFileSizeBytes);
      if (sizeOk.length < filtered.length) {
        setFileWarning("Some files were too large (max 10 MB) and were skipped.");
      }
      const combined = [...selectedFiles, ...sizeOk].slice(0, maxFiles);
      if (combined.length < selectedFiles.length + sizeOk.length) {
        setFileWarning("You can attach up to 10 files per message.");
      }
      setSelectedFiles(combined);
      event.target.value = "";
    },
    [maxFileSizeBytes, maxFiles, selectedFiles]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
    <div className="sticky bottom-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-white/95">
      {previewFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {previewFiles.map((file, index) => (
            <div
              key={file.id}
              className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-sm"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-20 w-20 object-cover cursor-pointer"
                  onClick={() => onOpenLightbox(file.url, file.name)}
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center text-xs text-slate-600">
                  PDF
                </div>
              )}
              <button
                onClick={() => handleRemoveFile(index)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white/90 text-slate-600 text-xs hover:bg-white cursor-pointer"
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
          className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
          aria-label="Attach files"
        >
          <PaperClipIcon className="w-4 h-4" />
        </button>
        <input
          value={messageInput}
          onChange={(e) => handleTypingChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />
        <button
          onClick={handleSend}
          className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
        <span>Max 10 files per message.</span>
        <span>Images and PDFs only.</span>
        {fileWarning && <span className="text-amber-600">{fileWarning}</span>}
      </div>
    </div>
  );
}
