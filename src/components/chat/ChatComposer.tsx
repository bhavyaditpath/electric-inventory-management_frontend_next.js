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
  ChevronDownIcon,
  FaceSmileIcon,
  EyeIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import EmojiPicker from "@emoji-mart/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import type {
  ChatLanguage,
  ChatMessageKind,
  ChatReplyPreview,
} from "@/types/chat.types";
import { emojiMartData } from "@/utils/emojiPickerData";
import { useThemeMode } from "@/hooks/useThemeMode";
import { ThemeMode } from "@/types/enums";

interface ChatComposerProps {
  roomId?: number | null;
  onSendMessage: (
    content: string,
    files?: File[],
    replyToMessageId?: number,
    kind?: ChatMessageKind,
    language?: ChatLanguage,
    viewOnce?: boolean
  ) => void;
  onTyping: (isTyping: boolean) => void;
  onOpenLightbox: (url: string, name: string, onCloseCleanup?: () => void) => void;
  replyToMessage?: ChatReplyPreview | null;
  onCancelReply?: () => void;
  maxFiles?: number;
  maxFileSizeBytes?: number;
}

type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
};

const LANGUAGE_OPTIONS: Array<{ label: string; value: ChatLanguage }> = [
  { label: "Plain Text", value: "plaintext" },
  { label: "Bash", value: "bash" },
  { label: "C++", value: "cpp" },
  { label: "C#", value: "csharp" },
  { label: "CSS", value: "css" },
  { label: "HTML", value: "html" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "JSON", value: "json" },
  { label: "Python", value: "python" },
  { label: "SQL", value: "sql" },
  { label: "TypeScript", value: "typescript" },
];

const LANGUAGE_SET = new Set<ChatLanguage>(
  LANGUAGE_OPTIONS.map((item) => item.value)
);
const lowlight = createLowlight(common);

const normalizeLanguage = (value: unknown): ChatLanguage => {
  if (typeof value !== "string") return "plaintext";
  return LANGUAGE_SET.has(value as ChatLanguage)
    ? (value as ChatLanguage)
    : "plaintext";
};

const extractText = (node?: TiptapNode | null): string => {
  if (!node) return "";
  if (node.type === "hardBreak") return "\n";
  const own = typeof node.text === "string" ? node.text : "";
  const nested = (node.content || []).map((child) => extractText(child)).join("");
  return `${own}${nested}`;
};

const BLOCK_NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "bulletList",
  "orderedList",
]);

const extractPlainText = (node?: TiptapNode | null): string => {
  if (!node) return "";
  if (node.type === "hardBreak") return "\n";
  if (typeof node.text === "string") return node.text;

  const children = node.content || [];
  if (children.length === 0) return "";

  return children.reduce((acc, child, index) => {
    let next = acc + extractPlainText(child);
    const isLast = index === children.length - 1;
    if (!isLast && BLOCK_NODE_TYPES.has(child.type || "") && !next.endsWith("\n")) {
      next += "\n";
    }
    return next;
  }, "");
};

const collectMeaningfulNodes = (nodes: TiptapNode[] = []): TiptapNode[] => {
  const result: TiptapNode[] = [];

  const visit = (node: TiptapNode) => {
    if (node.type === "codeBlock") {
      if (extractText(node).trim()) result.push(node);
      return;
    }

    if (typeof node.text === "string" && node.text.trim()) {
      result.push(node);
      return;
    }

    (node.content || []).forEach(visit);
  };

  nodes.forEach(visit);
  return result;
};

const getPayloadFromDoc = (doc: TiptapNode): {
  content: string;
  kind: ChatMessageKind;
  language: ChatLanguage;
} => {
  const contentNodes = doc.content || [];
  const meaningful = collectMeaningfulNodes(contentNodes);

  if (meaningful.length === 1 && meaningful[0].type === "codeBlock") {
    const codeNode = meaningful[0];
    const codeText = extractText(codeNode).trim();
    const language = normalizeLanguage(codeNode.attrs?.language);

    if (language === "json") {
      return { content: codeText, kind: "json", language };
    }
    if (language === "html") {
      return { content: codeText, kind: "html", language };
    }
    return { content: codeText, kind: "code", language };
  }

  const plainText = extractPlainText(doc).trim();
  return { content: plainText, kind: "text", language: "plaintext" };
};

export default function ChatComposer({
  roomId,
  onSendMessage,
  onTyping,
  onOpenLightbox,
  replyToMessage,
  onCancelReply,
  maxFiles = 10,
  maxFileSizeBytes = 10 * 1024 * 1024,
}: ChatComposerProps) {
  const themeMode = useThemeMode();
  const totalLimitMb = Math.floor(maxFileSizeBytes / (1024 * 1024));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<ChatLanguage>("plaintext");
  const [sendAsViewOnce, setSendAsViewOnce] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const languageButtonRef = useRef<HTMLButtonElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComposingRef = useRef(false);
  const handleSendRef = useRef<() => void>(() => undefined);
  const addFilesRef = useRef<(files: File[]) => void>(() => undefined);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder: "Type a message...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "chat-composer-editor min-h-[20px] max-h-[120px] overflow-y-auto text-sm leading-relaxed text-[var(--theme-text)] focus:outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      },
      handleKeyDown: (_view, event) => {
        if (event.key !== "Enter" || isComposingRef.current) {
          return false;
        }

        if (event.shiftKey) {
          return false;
        }

        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          handleSendRef.current();
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const clipboardFiles = Array.from(event.clipboardData?.files || []);
        const imageFiles = clipboardFiles.filter((file) =>
          file.type.startsWith("image/")
        );
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        addFilesRef.current(imageFiles);
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const text = instance.getText().trim();
      onTyping(text.length > 0);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 800);
    },
  });

  const activeLanguageLabel = useMemo(() => {
    const found = LANGUAGE_OPTIONS.find((item) => item.value === selectedLanguage);
    return found?.label || "Plain Text";
  }, [selectedLanguage]);

  const handleSend = useCallback(() => {
    if (!roomId || !editor) return;

    const payload = getPayloadFromDoc(editor.getJSON() as TiptapNode);
    const hasFiles = selectedFiles.length > 0;

    if (!payload.content && !hasFiles) return;

    if (sendAsViewOnce) {
      if (selectedFiles.length !== 1 || !selectedFiles[0].type.startsWith("image/")) {
        setFileWarning("View once supports a single image only.");
        return;
      }
    }

    if (payload.kind === "json" && payload.content) {
      try {
        JSON.parse(payload.content);
      } catch {
        setFileWarning("Invalid JSON format.");
        return;
      }
    }

    setFileWarning(null);
    onSendMessage(
      payload.content,
      selectedFiles,
      replyToMessage?.id,
      payload.kind,
      payload.language,
      sendAsViewOnce
    );

    editor.commands.clearContent(true);
    editor.commands.focus();
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    setShowLanguageMenu(false);
    setSelectedLanguage("plaintext");
    setSendAsViewOnce(false);
    onTyping(false);
  }, [editor, onSendMessage, onTyping, replyToMessage?.id, roomId, selectedFiles, sendAsViewOnce]);

  handleSendRef.current = handleSend;

  const handlePickFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
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
        warning = `You can attach up to ${maxFiles} files per message.`;
      } else if (skippedForType) {
        warning = "Only images and PDFs are allowed.";
      }

      setFileWarning(warning);
      setSelectedFiles(nextFiles);
    },
    [maxFileSizeBytes, maxFiles, selectedFiles, totalLimitMb]
  );

  addFilesRef.current = addFiles;

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      addFiles(files);
      event.target.value = "";
    },
    [addFiles]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleEmojiClick = useCallback(
    (emojiData: { native?: string }) => {
      if (!editor) return;
      if (!emojiData?.native) return;
      editor.chain().focus().insertContent(emojiData.native).run();
    },
    [editor]
  );

  const applyLanguage = useCallback(
    (language: ChatLanguage) => {
      if (!editor) return;

      setSelectedLanguage(language);
      setShowLanguageMenu(false);

      if (language === "plaintext") {
        if (editor.isActive("codeBlock")) {
          editor.chain().focus().toggleCodeBlock().run();
        }
        return;
      }

      if (!editor.isActive("codeBlock")) {
        editor.chain().focus().toggleCodeBlock().run();
      }

      editor.chain().focus().updateAttributes("codeBlock", { language }).run();
    },
    [editor]
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      previewFiles.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [previewFiles]);

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
    if (!showLanguageMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (languageMenuRef.current?.contains(target)) return;
      if (languageButtonRef.current?.contains(target)) return;
      setShowLanguageMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageMenu]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.clearContent(true);
    setSelectedFiles([]);
    setFileWarning(null);
    setShowEmojiPicker(false);
    setShowLanguageMenu(false);
    setSelectedLanguage("plaintext");
    setSendAsViewOnce(false);
  }, [editor, roomId]);

  useEffect(() => {
    if (!sendAsViewOnce) return;
    const hasSingleImage =
      selectedFiles.length === 1 && selectedFiles[0]?.type.startsWith("image/");
    if (!hasSingleImage) {
      setSendAsViewOnce(false);
    }
  }, [selectedFiles, sendAsViewOnce]);

  useEffect(() => {
    if (!editor) return;
    if (!editor.isActive("codeBlock")) {
      setSelectedLanguage("plaintext");
      return;
    }
    const language = normalizeLanguage(editor.getAttributes("codeBlock").language);
    setSelectedLanguage(language);
  }, [editor, editor?.state]);

  return (
    <div className="sticky bottom-0 z-10 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-t border-[var(--theme-border)] bg-[var(--theme-surface)]">
      {replyToMessage && (
        <div className="mb-2 sm:mb-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-2 sm:px-3 py-1.5 sm:py-2">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[var(--theme-text-muted)]">
                Replying to {replyToMessage.senderName || "Unknown user"}
              </p>
              <p className="text-xs text-[var(--theme-text)] truncate">
                {replyToMessage.isRemoved
                  ? "This message was deleted"
                  : replyToMessage.content}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 rounded-full text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface)] cursor-pointer flex-shrink-0"
              aria-label="Cancel reply"
            >
              <XMarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}
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
      <div className="flex items-end gap-1 sm:gap-2 md:gap-3 min-w-0">
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
          className="p-1.5 sm:p-2 lg:p-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer flex-shrink-0"
          aria-label="Attach files"
        >
          <PaperClipIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => setSendAsViewOnce((prev) => !prev)}
          disabled={selectedFiles.length === 0}
          className={`p-1.5 sm:p-2 lg:p-2.5 rounded-full border cursor-pointer flex-shrink-0 ${
            sendAsViewOnce
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)]"
          } ${selectedFiles.length === 0 ? "opacity-50 cursor-not-allowed" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70`}
          aria-label="Send as view once"
          title="Send as view once"
        >
          <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="relative shrink-0 hidden sm:block">
          <button
            ref={languageButtonRef}
            onClick={() => setShowLanguageMenu((prev) => !prev)}
            className="h-9 sm:h-10 px-2 sm:px-3 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer inline-flex items-center gap-1.5 text-xs sm:text-sm"
            aria-label="Code language"
          >
            <span className="truncate max-w-16 sm:max-w-24">{activeLanguageLabel}</span>
            <ChevronDownIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          </button>
          {showLanguageMenu && (
            <div
              ref={languageMenuRef}
              className="absolute bottom-11 sm:bottom-12 left-0 z-20 w-40 sm:w-48 rounded-lg sm:rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg sm:shadow-xl max-h-64 overflow-y-auto"
            >
              <div className="px-1 sm:px-2 py-1">
                {LANGUAGE_OPTIONS.map((option) => {
                  const isActive = option.value === selectedLanguage;
                  return (
                    <button
                      key={option.value}
                      onClick={() => applyLanguage(option.value)}
                      className={`w-full text-left px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs rounded-md sm:rounded-lg cursor-pointer ${isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-[var(--theme-text)] hover:bg-[var(--theme-surface-muted)]"
                        }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-1.5 sm:p-2 lg:p-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-muted)] cursor-pointer flex-shrink-0"
            aria-label="Open emoji picker"
          >
            <FaceSmileIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-11 sm:bottom-12 left-0 z-20 shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl overflow-hidden"
            >
              <EmojiPicker
                data={emojiMartData}
                onEmojiSelect={handleEmojiClick}
                searchPosition="sticky"
                previewPosition="bottom"
                skinTonePosition="search"
                theme={themeMode === ThemeMode.Dark ? "dark" : "light"}
                perLine={8}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 border border-[var(--theme-border)] rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 focus-within:ring-2 focus-within:ring-blue-500">
          <EditorContent editor={editor} />
        </div>

        <button
          onClick={handleSend}
          className="p-1.5 sm:p-2 lg:p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer flex-shrink-0"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[var(--theme-text-muted)] flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-1 sm:gap-2">
        <span className="whitespace-nowrap">Max {maxFiles} files</span>
        <span className="hidden sm:inline">•</span>
        <span className="whitespace-nowrap">Up to {totalLimitMb} MB</span>
        <span className="hidden sm:inline">•</span>
        <span className="whitespace-nowrap">Images & PDFs only</span>
        {fileWarning && <span className="text-amber-600 w-full">{fileWarning}</span>}
      </div>
    </div>
  );
}
