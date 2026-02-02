'use client';

import { Message } from '@/types/chat.types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  previousMessage?: Message;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  showName = false,
  previousMessage,
}: MessageBubbleProps) {
  const { user } = useAuth();

  const isConsecutive = previousMessage?.senderId === message.senderId;

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`flex gap-2 px-4 py-1 ${
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      } ${isConsecutive ? 'mt-1' : 'mt-3'}`}
    >
      {/* Avatar */}
      {!isOwnMessage && showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
          {message.sender?.profilePicture ? (
            <img
              src={message.sender.profilePicture}
              alt={message.sender.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {message.sender?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isOwnMessage ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender name */}
        {!isOwnMessage && showName && !isConsecutive && (
          <span className="text-xs text-slate-500 mb-1 ml-1">
            {message.sender?.username || 'Unknown'}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-slate-100 text-slate-800 rounded-bl-md'
          }`}
        >
          {/* Attachment */}
          {message.type === 'image' && message.attachmentUrl && (
            <div className="mb-2">
              <img
                src={message.attachmentUrl}
                alt={message.attachmentName || 'Image'}
                className="max-w-full rounded-lg"
                loading="lazy"
              />
            </div>
          )}

          {message.type === 'file' && message.attachmentUrl && (
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span className="truncate max-w-[150px]">
                {message.attachmentName || 'File'}
              </span>
            </a>
          )}

          {/* Text content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Time and read status */}
          <div
            className={`flex items-center gap-1 mt-1 ${
              isOwnMessage ? 'justify-end' : 'justify-start'
            }`}
          >
            <span
              className={`text-xs ${
                isOwnMessage ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              {formatTime(message.createdAt)}
            </span>
            {isOwnMessage && (
              <span className="text-xs text-blue-100">
                {message.isRead ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
