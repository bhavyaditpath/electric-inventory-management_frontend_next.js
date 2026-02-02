'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ChatInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', attachmentUrl?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  typingUsers?: Set<string>;
}

export default function ChatInput({
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  typingUsers = new Set(),
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping && onTyping) {
      onTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, onTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      onTyping?.(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!message.trim() || disabled) return;

    try {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      onTyping?.(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files = Array.from(items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  return (
    <div className="border-t border-slate-200 p-4 bg-white">
      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="text-xs text-slate-500 mb-2 px-4">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-4">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2"
            >
              <span className="text-sm truncate max-w-[100px]">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="chat-file-input"
            accept="image/*,.pdf,.doc,.docx"
          />
          <label
            htmlFor="chat-file-input"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <PaperClipIcon className="w-5 h-5" />
          </label>
        </div>

        {/* Emoji button */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <FaceSmileIcon className="w-5 h-5" />
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
