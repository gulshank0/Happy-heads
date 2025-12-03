const BACKEND_URL = import.meta.env.BACKEND_URL;

import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, Users, X, Check } from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'match';
  title: string;
  message: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: string;
  isRead: boolean;
  conversationId?: string;
}

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Set up real-time updates
    const interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to only show messages and matches
        const filteredNotifications = data.notifications?.filter(
          (notif: any) => notif.type === 'message' || notif.type === 'match'
        ) || [];
        
        setNotifications(filteredNotifications);
        setUnreadCount(filteredNotifications.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string, type: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/mark-read`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: [notificationId],
          type
        })
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Emit event to update badge count dynamically
      window.dispatchEvent(new CustomEvent('notification-read', { 
        detail: { count: 1 } 
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Add effect to mark all notifications as read when component mounts
  useEffect(() => {
    if (notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length > 0) {
        // Mark all as read after a short delay to allow user to see them
        const timer = setTimeout(() => {
          unreadNotifications.forEach(notif => {
            markAsRead(notif.id, notif.type);
          });
        }, 2000); // 2 second delay

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id, notification.type);
    }

    // Navigate based on notification type
    if (notification.type === 'message' && notification.conversationId) {
      // Navigate to messages
      window.location.hash = '#messages';
    } else if (notification.type === 'match') {
      // Navigate to matches
      window.location.hash = '#matches';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-400" />;
      case 'match':
        return <Heart className="h-5 w-5 text-pink-400" />;
      default:
        return <Bell className="h-5 w-5 text-violet-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-400 border-t-transparent mx-auto mb-4"></div>
            <p className="text-white/60">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <div className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} new
              </div>
            )}
          </div>
          <p className="text-white/60">
            Stay updated with your matches and messages
          </p>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No notifications yet</h3>
              <p className="text-white/60">
                When someone messages you or you get a match, you'll see it here!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`backdrop-blur-md border border-white/10 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:border-white/20 hover:bg-white/5 ${
                  !notification.isRead ? 'bg-white/5 border-violet-500/30' : 'bg-white/5'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* User Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={notification.user.avatar || `https://api.dicebear.com/8.x/lorelei/svg?seed=${notification.user.name}`}
                      alt={notification.user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-violet-400/50"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-white/80 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-white/50 text-sm">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      {/* Read indicator */}
                      <div className="flex-shrink-0 ml-4">
                        {!notification.isRead ? (
                          <div className="w-3 h-3 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full animate-pulse"></div>
                        ) : (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action indicator */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-white/40 text-sm">
                    {notification.type === 'match' ? 'Tap to view your matches' : 'Tap to open conversation'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    notification.type === 'match' 
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {notification.type === 'match' ? 'Match' : 'Message'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real-time indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-white/40 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live updates active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;