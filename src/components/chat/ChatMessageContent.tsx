"use client";

import { useMemo, useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ChatMessage } from "@/types/chat.types";
import { getFormatLabel, resolveFormat } from "@/utils/chatMessageFormat";

interface ChatMessageContentProps {
  message: ChatMessage;
  isMe: boolean;
}

// Language mapping for react-syntax-highlighter
const LANGUAGE_MAP: Record<string, string> = {
  plaintext: "text",
  javascript: "javascript",
  typescript: "typescript",
  json: "json",
  html: "markup",
  css: "css",
  sql: "sql",
  bash: "bash",
  python: "python",
  java: "java",
  csharp: "csharp",
  cpp: "cpp",
};

export default function ChatMessageContent({
  message,
  }: ChatMessageContentProps) {
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    
    return () => observer.disconnect();
  }, []);
  
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

  const syntaxLanguage = LANGUAGE_MAP[normalized.language] || "text";

  if (!rawContent.trim()) return null;

  if (!isCodeLike) {
    return (
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
        {rawContent}
      </p>
    );
  }

  return (
    <div className="code-message-wrapper">
      <div className="code-message-header">
        <span className="code-message-language">
          {getFormatLabel(message.kind, message.language)}
        </span>
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
          className="code-message-copy-btn"
          aria-label="Copy message content"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <div className="syntax-highlighter-wrapper">
        <SyntaxHighlighter
          language={syntaxLanguage}
          style={isDarkMode ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            padding: "12px",
            fontSize: "13px",
            lineHeight: "1.5",
            borderRadius: 0,
          }}
          codeTagProps={{
            style: {
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            },
          }}
        >
          {displayContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}