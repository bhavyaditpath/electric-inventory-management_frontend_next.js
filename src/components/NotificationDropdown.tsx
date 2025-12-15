'use client';

import { useState, useRef, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { notificationApi, Notification } from '../Services/notification.api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/enums';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);

        // Fetch latest notifications - 5 for desktop, 3 for mobile
        const response = await notificationApi.getLatest(5);

        if (response.success && response.data) {
          setNotifications(response.data.data || []);
        } else {
          console.error('Failed to fetch notifications:', response.message);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        if (response.success && response.data) {
          setUnreadCount(response.data.unreadCount);
        } else {
          console.error('Failed to fetch unread count:', response.message);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSeeMore = () => {
    // Redirect to role-specific notification page
    if (user?.role === UserRole.ADMIN) {
      router.push('/admin/notifications');
    } else {
      router.push('/branch/notifications');
    }
    setDropdownOpen(false);
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => prev - 1);
      } else {
        console.error('Failed to mark notification as read:', response.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 sm:p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer touch-manipulation"
        aria-label="Toggle notifications"
      >
        <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full"></span>
        )}
      </button>

      {dropdownOpen && (
        <>
          {/* Mobile Modal - Clean bottom sheet without overlay */}
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden border-t border-slate-200">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
              <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
              <button
                onClick={() => setDropdownOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No notifications found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all touch-manipulation ${!notification.read
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                        }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium line-clamp-1 ${!notification.read ? 'text-blue-600' : 'text-slate-800'
                            }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-xs mt-1 line-clamp-2 ${!notification.read ? 'text-slate-700' : 'text-slate-500'
                            }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full ${notification.type === 'user'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                            }`}>
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <button
                onClick={handleSeeMore}
                className="w-full text-center text-sm text-blue-600 hover:bg-blue-50 py-3 rounded-lg transition-all touch-manipulation"
              >
                See All Notifications
              </button>
            </div>
          </div>

          {/* Desktop Dropdown - Original Design */}
          <div className="hidden sm:block absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">{unreadCount} new</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-4 text-center text-slate-500">
                  <p className="text-sm">No notifications found</p>
                </div>
              ) : (
                notifications.slice(0, 5).map(notification => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-all touch-manipulation ${!notification.read ? 'bg-blue-50' : ''
                      }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-blue-600' : 'text-slate-800'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-xs mt-1 ${!notification.read ? 'text-slate-700' : 'text-slate-500'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${notification.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-200">
              <button
                onClick={handleSeeMore}
                className="w-full text-center text-sm text-blue-600 hover:bg-blue-50 py-1 rounded transition-all"
              >
                See More
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}