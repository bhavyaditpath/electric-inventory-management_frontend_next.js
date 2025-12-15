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
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Notifications
          <span className="text-slate-500 text-lg ml-2">({unreadCount} unread)</span>
        </h1>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all"
        >
          Mark All as Read
        </button>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'user' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          User Notifications
        </button>
        <button
          onClick={() => setActiveTab('branch')}
          className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'branch' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Branch Notifications
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <p>No notifications found for this category</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredNotifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition-all ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${!notification.read ? 'text-blue-600' : 'text-slate-800'}`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm mt-1 ${!notification.read ? 'text-slate-700' : 'text-slate-500'}`}>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
