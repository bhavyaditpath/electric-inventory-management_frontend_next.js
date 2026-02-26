"use client";

import { useMemo, useState } from "react";
import type { ChatMessage } from "@/types/chat.types";
import { getFormatLabel, resolveFormat } from "@/utils/chatMessageFormat";

interface ChatMessageContentProps {
  message: ChatMessage;
  isMe: boolean;
}

export default function ChatMessageContent({
  message,
  isMe,
}: ChatMessageContentProps) {
  const [copied, setCopied] = useState(false);
  const rawContent = message.content || "";
  const normalized = resolveFormat(message.kind, message.language);
  const isCodeLike =
    normalized.kind === "code" ||
    normalized.kind === "json" ||
    normalized.kind === "html";

  const displayContent = useMemo(() => {
    if (normalized.kind === "json") {
      try {
        return JSON.stringify(JSON.parse(rawContent), null, 2);
      } catch {
        return rawContent;
      }
    }
    return rawContent;
  }, [normalized.kind, rawContent]);

  if (!rawContent.trim()) return null;

  if (!isCodeLike) {
    return (
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
        {rawContent}
      </p>
    );
  }

  return (
    <div
      className={`rounded-lg border mt-1 ${
        isMe
          ? "border-white/20 bg-black/20"
          : "border-[var(--theme-border)] bg-[var(--theme-surface-muted)]"
      }`}
    >
      <div
        className={`px-2.5 py-1.5 border-b text-[11px] flex items-center justify-between gap-2 ${
          isMe
            ? "border-white/20 text-blue-100"
            : "border-[var(--theme-border)] text-[var(--theme-text-muted)]"
        }`}
      >
        <span className="font-medium">{getFormatLabel(message.kind, message.language)}</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(rawContent);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {
              setCopied(false);
            }
          }}
          className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
            isMe
              ? "bg-white/10 hover:bg-white/20 text-blue-50"
              : "bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)]"
          }`}
          aria-label="Copy message content"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-3 text-xs leading-relaxed overflow-x-auto whitespace-pre">
        <code>{displayContent}</code>
      </pre>
    </div>
  );
}