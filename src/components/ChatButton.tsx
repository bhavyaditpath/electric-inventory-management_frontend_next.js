'use client';

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { NAVIGATION } from '../app/Constants/navigation.constants';
import { UserRole } from '../types/enums';

interface ChatButtonProps {
  unreadCount?: number;
}

export default function ChatButton({ unreadCount = 0 }: ChatButtonProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = () => {
    if (user?.role === UserRole.ADMIN) {
      router.push(NAVIGATION.admin.chat);
    } else {
      router.push(NAVIGATION.branch.chat);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 sm:p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer touch-manipulation"
      aria-label="Open chat"
    >
      <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full"></span>
      )}
    </button>
  );
}
