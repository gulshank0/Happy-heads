const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface NotificationStats {
  likesReceived: number;
  matches: number;
  unreadMessages: number;
  totalNotifications: number;
}

class NotificationService {
  private readonly timeout = 30000; // 30 seconds

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error('Server returned invalid JSON response');
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  // Get notification stats
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      console.log('🔍 Fetching notification stats...');
      
      const response = await this.fetchWithTimeout(`${BACKEND_URL}/api/notifications/stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await this.handleResponse<{ success: boolean; stats: NotificationStats }>(response);
      console.log('✅ Notification stats fetched:', data.stats);
      
      return data.stats || { likesReceived: 0, matches: 0, unreadMessages: 0, totalNotifications: 0 };
    } catch (error) {
      console.error('❌ Failed to fetch notification stats:', error);
      return { likesReceived: 0, matches: 0, unreadMessages: 0, totalNotifications: 0 };
    }
  }

  // Mark notifications as read
  async markNotificationsAsRead(notificationIds: string[], type: string): Promise<void> {
    try {
      console.log('🔍 Marking notifications as read:', { notificationIds, type });
      
      const response = await this.fetchWithTimeout(`${BACKEND_URL}/api/notifications/mark-read`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationIds,
          type
        })
      });
      
      await this.handleResponse<{ success: boolean }>(response);
      console.log('✅ Notifications marked as read');
    } catch (error) {
      console.error('❌ Failed to mark notifications as read:', error);
      throw error;
    }
  }

  // Get all notifications
  async getNotifications(): Promise<any[]> {
    try {
      console.log('🔍 Fetching notifications...');
      
      const response = await this.fetchWithTimeout(`${BACKEND_URL}/api/notifications`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await this.handleResponse<{ success: boolean; notifications: any[] }>(response);
      console.log('✅ Notifications fetched:', data.notifications?.length || 0);
      
      return data.notifications || [];
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;