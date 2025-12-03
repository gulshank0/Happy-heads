import { useState, useEffect, useCallback } from 'react';
import { messageService } from '@/services/messageService';
import { notificationService } from '@/services/notificationService';

interface UnreadCounts {
  messages: number;
  notifications: number;
}

export const useUnreadCounts = () => {
  const [counts, setCounts] = useState<UnreadCounts>({
    messages: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const [messageCount, notificationStats] = await Promise.all([
        messageService.getUnreadCount(),
        notificationService.getNotificationStats()
      ]);

      setCounts({
        messages: messageCount,
        // For notifications, we only count likes and matches (not messages as they're handled separately)
        notifications: (notificationStats.likesReceived || 0) + (notificationStats.matches || 0)
      });
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const decrementMessageCount = useCallback(() => {
    setCounts(prev => ({
      ...prev,
      messages: Math.max(0, prev.messages - 1)
    }));
  }, []);

  const decrementNotificationCount = useCallback((count: number = 1) => {
    setCounts(prev => ({
      ...prev,
      notifications: Math.max(0, prev.notifications - count)
    }));
  }, []);

  const resetMessageCount = useCallback(() => {
    setCounts(prev => ({ ...prev, messages: 0 }));
  }, []);

  const resetNotificationCount = useCallback(() => {
    setCounts(prev => ({ ...prev, notifications: 0 }));
  }, []);

  useEffect(() => {
    fetchCounts();

    // Set up polling to update counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);

    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Listen for custom events to update counts dynamically
  useEffect(() => {
    const handleMessageRead = () => decrementMessageCount();
    const handleNotificationRead = (event: CustomEvent) => {
      decrementNotificationCount(event.detail?.count || 1);
    };
    const handleConversationRead = () => resetMessageCount();
    const handleAllNotificationsRead = () => resetNotificationCount();

    window.addEventListener('message-read', handleMessageRead);
    window.addEventListener('notification-read', handleNotificationRead as EventListener);
    window.addEventListener('conversation-read', handleConversationRead);
    window.addEventListener('all-notifications-read', handleAllNotificationsRead);

    return () => {
      window.removeEventListener('message-read', handleMessageRead);
      window.removeEventListener('notification-read', handleNotificationRead as EventListener);
      window.removeEventListener('conversation-read', handleConversationRead);
      window.removeEventListener('all-notifications-read', handleAllNotificationsRead);
    };
  }, [decrementMessageCount, decrementNotificationCount, resetMessageCount, resetNotificationCount]);

  return {
    counts,
    loading,
    fetchCounts,
    decrementMessageCount,
    decrementNotificationCount,
    resetMessageCount,
    resetNotificationCount
  };
};