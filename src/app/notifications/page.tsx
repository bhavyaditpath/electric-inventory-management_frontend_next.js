'use client';

import { useState, useEffect } from 'react';
import { notificationApi, Notification } from '../../Services/notification.api';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'user' | 'branch'>('user');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // Fetch all notifications
        const response = await notificationApi.getAll(activeTab);
        
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
  }, [activeTab]);

  const markAsRead = async (id: string) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      } else {
        console.error('Failed to mark notification as read:', response.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        // Refetch notifications to update read status
        const fetchResponse = await notificationApi.getAll(activeTab);
        if (fetchResponse.success && fetchResponse.data) {
          setNotifications(fetchResponse.data.data || []);
        }
      } else {
        console.error('Failed to mark all notifications as read:', response.message);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const filteredNotifications = activeTab === 'user'
    ? notifications.filter((n: Notification) => n.type === 'user')
    : notifications.filter((n: Notification) => n.type === 'branch');

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header Section */}
      <div className="mb-4 sm:mb-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Notifications
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all touch-manipulation"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 sm:mb-3">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('user')}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-all whitespace-nowrap touch-manipulation ${
              activeTab === 'user' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            User Notifications
          </button>
          <button
            onClick={() => setActiveTab('branch')}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-all whitespace-nowrap touch-manipulation ${
              activeTab === 'branch' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Branch Notifications
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-slate-500">
            <div className="max-w-sm mx-auto">
              <p className="text-sm sm:text-base">No notifications found for this category</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredNotifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 hover:bg-slate-50 transition-all touch-manipulation ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm sm:text-base font-medium line-clamp-2 ${
                      !notification.read ? 'text-blue-600' : 'text-slate-800'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm sm:text-base mt-1 line-clamp-3 ${
                      !notification.read ? 'text-slate-700' : 'text-slate-500'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      notification.type === 'user' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {notification.type}
                    </span>
                  </div>
                </div>
                {!notification.read && (
                  <div className="mt-2 flex items-center text-xs text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Click to mark as read</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-4">
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6 sm:p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
