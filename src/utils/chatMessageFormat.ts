import type { ChatLanguage, ChatMessageKind } from "@/types/chat.types";

const LANGUAGE_LABELS: Record<ChatLanguage, string> = {
  plaintext: "Plain Text",
  javascript: "JavaScript",
  typescript: "TypeScript",
  json: "JSON",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  bash: "Bash",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
};

export const resolveFormat = (
  kind?: ChatMessageKind,
  language?: ChatLanguage
): { kind: ChatMessageKind; language: ChatLanguage } => {
  const normalizedKind: ChatMessageKind = kind || "text";
  if (normalizedKind === "code") {
    return { kind: normalizedKind, language: language || "plaintext" };
  }
  if (normalizedKind === "json") {
    return { kind: normalizedKind, language: "json" };
  }
  if (normalizedKind === "html") {
    return { kind: normalizedKind, language: "html" };
  }
  return { kind: normalizedKind, language: "plaintext" };
};

export const getFormatLabel = (
  kind?: ChatMessageKind,
  language?: ChatLanguage
): string => {
  const normalized = resolveFormat(kind, language);
  if (normalized.kind === "text") return "Plain Text";
  if (normalized.kind === "markdown") return "Markdown";
  if (normalized.kind === "json") return "JSON";
  if (normalized.kind === "html") return "HTML";
  return LANGUAGE_LABELS[normalized.language] || "Plain Text";
};

export const getFormatPreviewPrefix = (
  kind?: ChatMessageKind,
  language?: ChatLanguage
): string => {
  const normalized = resolveFormat(kind, language);
  if (normalized.kind === "text" && normalized.language === "plaintext") {
    return "";
  }
  return `[${getFormatLabel(normalized.kind, normalized.language)}] `;
};