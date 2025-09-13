// Separate URLs for HTTP API and WebSocket connections
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

import websocketService from './websocketService';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string; 
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'EMOJI';
  timestamp: string; // Should be createdAt for consistency with backend
  isRead: boolean;
  isDelivered?: boolean;
  conversationId: string; // Should be required, not optional
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface MessageDeliveryStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    lastSeen: string;
    isOnline: boolean;
  };
  lastMessage: {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  messages?: Message[];
  lastMessageAt?: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class MessageService {
  private conversationCache = new Map<string, Conversation>();
  private messageCache = new Map<string, Message[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private setCacheItem<T>(key: string, value: T, cache: Map<string, T>): void {
    cache.set(key, value);
    setTimeout(() => cache.delete(key), this.cacheTimeout);
  }

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
      // Add more specific error handling
      if (error instanceof SyntaxError) {
        throw new Error('Server returned invalid JSON response');
      }
      throw new Error(`Failed to parse server response: ${error.message}`);
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
      
      switch (response.status) {
        case 401:
          // Consider triggering logout/redirect to login
          throw new Error('Authentication required. Please log in again.');
        case 403:
          throw new Error('Access denied');
        case 404:
          throw new Error('Resource not found');
        case 422:
          throw new Error('Invalid data provided');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server error. Please try again.');
        default:
          throw new Error(errorMessage);
      }
    }

    // Handle wrapped responses
    if (data && typeof data === 'object') {
      if ('success' in data && data.success === false) {
        throw new Error(data.error || data.message || 'Request failed');
      }
      
      return 'data' in data ? data.data : data;
    }

    return data;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>, 
    maxRetries = 3, 
    delay = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Only retry on network errors or 5xx status codes
        if (error.message.includes('timeout') || 
            error.message.includes('Server error')) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        
        throw error; // Don't retry client errors (4xx)
      }
    }
  }

  private validateMessage(content: string, messageType: string): void {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    if (content.length > 10000) {
      throw new Error('Message content is too long (max 10,000 characters)');
    }

    const validTypes = ['TEXT', 'IMAGE', 'FILE', 'EMOJI'];
    if (!validTypes.includes(messageType)) {
      throw new Error(`Invalid message type: ${messageType}`);
    }

    // Add XSS protection
    const dangerousPatterns = /<script|javascript:|data:/i;
    if (dangerousPatterns.test(content)) {
      throw new Error('Message contains unsafe content');
    }
  }

  private async encryptMessage(content: string): Promise<string> {
    // Add client-side encryption for sensitive content
    return content; // Placeholder
  }

  // Get all conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      console.log('🔍 Fetching conversations...');
      
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/conversations`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await this.handleResponse<Conversation[]>(response);
      console.log('✅ Conversations fetched:', data?.length || 0);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Failed to fetch conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<Message[]> {
    try {
      console.log('🔍 Fetching messages for conversation:', conversationId);
      
      const response = await this.fetchWithTimeout(
        `${API_BASE_URL}/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
        { 
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await this.handleResponse<Message[]>(response);
      console.log('✅ Messages fetched:', data?.length || 0);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      throw error;
    }
  }

  // Send a message to a user (creates conversation if needed)
  async sendMessageToUser(receiverId: string, content: string, messageType = 'TEXT'): Promise<Message> {
    try {
      console.log('🔍 Sending message:', { receiverId, content, messageType });
      
      if (!receiverId || !content.trim()) {
        throw new Error('Receiver ID and content are required');
      }

      if (content.length > 10000) {
        throw new Error('Message content is too long (max 10,000 characters)');
      }

      // Use the correct endpoint that matches backend routing
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          receiverId, 
          content: content.trim(), 
          messageType 
        })
      });

      const data = await this.handleResponse<Message>(response);
      console.log('✅ Message sent successfully:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  // Create conversation
  async createConversation(otherUserId: string): Promise<Conversation> {
    try {
      console.log('🔍 Creating conversation with user:', otherUserId);
      
      if (!otherUserId) {
        throw new Error('Other user ID is required');
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ otherUserId })
      });
      
      const data = await this.handleResponse<Conversation>(response);
      console.log('✅ Conversation created successfully:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
      throw error;
    }
  }

  // Mark messages as read (HTTP fallback)
  async markAsRead(conversationId: string): Promise<{ count: number }> {
    try {
      console.log('🔍 Marking messages as read for conversation:', conversationId);
      
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await this.handleResponse<{ count: number }>(response);
      console.log('✅ Messages marked as read:', data);
      
      return data || { count: 0 };
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
      throw error;
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      console.log('🔍 Deleting conversation:', conversationId);
      
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      await this.handleResponse<void>(response);
      console.log('✅ Conversation deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      console.log('🔍 Fetching conversation:', conversationId);
      
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await this.handleResponse<Conversation>(response);
      console.log('✅ Conversation fetched:', data);
      
      return data;
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('ℹ️ Conversation not found:', conversationId);
        return null;
      }
      console.error('❌ Failed to fetch conversation:', error);
      throw error;
    }
  }

  // Search users for new conversations
  async searchUsers(query: string): Promise<User[]> {
    try {
      console.log('🔍 Searching users:', query);
      
      // Use the correct endpoint URL
      let url = `${API_BASE_URL}/users`;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append('q', query.trim());
      }
      params.append('limit', '10');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🌐 Making request to:', url);
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        
        // Handle 404 specifically for user search
        if (response.status === 404) {
          console.log('ℹ️ No users found for query:', query);
          return []; // Return empty array instead of throwing error
        }
        
        throw new Error(`Failed to search users: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      // Backend returns users directly, not wrapped in success object
      if (Array.isArray(data)) {
        console.log('✅ Users found:', data.length);
        return data;
      } else {
        console.error('❌ Invalid response format:', data);
        return []; // Return empty array for invalid format
      }
    } catch (error) {
      console.error('❌ Failed to search users:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      } else if (error instanceof Error) {
        // Don't throw on 404, just return empty array
        if (error.message.includes('404')) {
          return [];
        }
        throw error;
      } else {
        throw new Error('Unknown error occurred while searching users');
      }
    }
  }

  // Search users for messaging
  async searchUsersForMessaging(req: Request, res: Response) {
    try {
      const currentUserId = (req.user as any)?.id;
      const { q: query, limit = '10' } = req.query;

      console.log('🔍 Search users request:', {
        currentUserId,
        query,
        limit,
        user: req.user
      });

      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const searchLimit = Math.min(parseInt(limit as string) || 10, 50);

      let whereClause: any = {
        id: { not: currentUserId } // Exclude current user
      };

      // Add search filters if query provided
      if (query && typeof query === 'string' && query.trim()) {
        const searchTerm = query.trim();
        whereClause.OR = [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ];
      }

      console.log('🔍 Search query:', whereClause);

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          age: true,
          createdAt: true
        },
        take: searchLimit,
        orderBy: {
          name: 'asc'
        }
      });

      console.log('✅ Found users:', users.length);

      // Check for existing conversations
      const usersWithConversationInfo = await Promise.all(
        users.map(async (user) => {
          const existingConversation = await prisma.conversation.findFirst({
            where: {
              OR: [
                { user1Id: currentUserId, user2Id: user.id },
                { user1Id: user.id, user2Id: currentUserId }
              ]
            }
          });

          return {
            ...user,
            hasExistingConversation: !!existingConversation
          };
        })
      );

      // Always return an array, even if empty
      res.json(usersWithConversationInfo);
    } catch (error) {
      console.error('❌ Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }

  // Get WebSocket connection info
  async getWebSocketInfo(userId?: string): Promise<any> {
    try {
      const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const url = `${API_BASE_URL}/api/websocket/info${params}`;
      
      console.log('🔍 Getting WebSocket info from:', url);
        
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await this.handleResponse<any>(response);
      console.log('✅ WebSocket info:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get WebSocket info:', error);
      throw error;
    }
  }

  // Check WebSocket health
  async checkWebSocketHealth(userId?: string): Promise<any> {
    try {
      const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const url = `${API_BASE_URL}/api/websocket/health${params}`;
      
      console.log('🔍 Checking WebSocket health:', url);
        
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await this.handleResponse<any>(response);
      console.log('✅ WebSocket health:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to check WebSocket health:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    try {
      console.log('🔍 Getting unread message count...');
      
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/messages/unread-count`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await this.handleResponse<{ count: number }>(response);
      console.log('✅ Unread count:', data?.count || 0);
      
      return data?.count || 0;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0; // Return 0 instead of throwing for this endpoint
    }
  }

  // Send message with conversation ID (for existing conversations)
  async sendMessageToConversation(
    conversationId: string, 
    receiverId: string, 
    content: string, 
    messageType = 'TEXT'
  ): Promise<Message> {
    console.log('🔍 Sending message to conversation:', { conversationId, receiverId, content, messageType });
    
    try {
      if (!conversationId || !receiverId || !content.trim()) {
        throw new Error('Conversation ID, receiver ID, and content are required');
      }

      if (content.length > 10000) {
        throw new Error('Message content is too long (max 10,000 characters)');
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          receiverId, 
          content: content.trim(), 
          messageType 
        })
      });

      const data = await this.handleResponse<Message>(response);
      console.log('✅ Message sent to conversation successfully:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to send message to conversation:', error);
      throw error;
    }
  }

  // Utility method to check if API is available
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return false;
    }
  }

  // Get API base URL (useful for debugging)
  getApiBaseUrl(): string {
    return API_BASE_URL;
  }

  // Update message delivery status
  async updateMessageStatus(messageId: string, status: string): Promise<void> {
    // Implementation for updating message delivery status
  }

  private isRealTimeAvailable(): boolean {
    return websocketService.isConnected();
  }

  // Initialize real-time messaging
  async initializeRealTime(): Promise<void> {
    try {
      console.log('🚀 Initializing real-time messaging...');
      
      // Set up event listeners first
      websocketService.on('new-message', (data) => {
        console.log('📨 New message received via WebSocket:', data);
        this.notifyMessageReceived(data.message);
      });

      websocketService.on('message-read', (data) => {
        console.log('👁️ Message read via WebSocket:', data);
        this.notifyMessageRead(data);
      });

      websocketService.on('user-typing', (data) => {
        console.log('⌨️ Typing indicator via WebSocket:', data);
        this.notifyTyping(data);
      });

      websocketService.on('user-status-changed', (data) => {
        console.log('🟢 User status changed via WebSocket:', data);
        this.notifyUserStatusChange(data);
      });

      websocketService.on('connect', () => {
        console.log('✅ Real-time messaging connected');
        this.notifyConnectionStatus('connected');
      });

      websocketService.on('disconnect', () => {
        console.log('🔌 Real-time messaging disconnected');
        this.notifyConnectionStatus('fallback');
        this.startPolling();
      });

      websocketService.on('reconnect-failed', () => {
        console.log('❌ Real-time messaging reconnection failed');
        this.notifyConnectionStatus('fallback');
        this.startPolling();
      });

      console.log('✅ Real-time messaging event listeners set up');
      
    } catch (error) {
      console.error('❌ Failed to initialize real-time messaging:', error);
      this.notifyConnectionStatus('fallback');
      this.startPolling();
      throw error;
    }
  }

  private startPolling(): void {
    // Poll for new messages every 5 seconds as fallback
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = setInterval(async () => {
      if (!this.isRealTimeAvailable() && this.activeConversationId) {
        try {
          // Silently poll for new messages
          await this.getMessages(this.activeConversationId);
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 5000);
  }

  private pollingInterval: NodeJS.Timeout | null = null;
  private activeConversationId: string | null = null;

  // Set active conversation for polling
  setActiveConversation(conversationId: string | null): void {
    this.activeConversationId = conversationId;
  }

  // Connection status notification
  private notifyConnectionStatus(status: 'connected' | 'fallback' | 'disconnected'): void {
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback(status);
    }
  }

  private connectionStatusCallback: ((status: string) => void) | null = null;

  onConnectionStatusChange(callback: (status: string) => void): void {
    this.connectionStatusCallback = callback;
  }

  // Send message with WebSocket first, fallback to HTTP
  async sendMessage(conversationId: string, content: string, type: string = 'text'): Promise<Message> {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: 'current-user', // This should be set properly
      content,
      type,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    // Optimistically add to UI
    this.notifyMessageReceived(tempMessage);

    try {
      // Try WebSocket first if available
      if (this.isRealTimeAvailable()) {
        websocketService.send('send_message', {
          conversationId,
          content,
          type
        });
      }

      // Always send via HTTP as well for reliability
      const response = await this.fetchWithTimeout(
        `${API_BASE_URL}/api/messages/send`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            content,
            type
          })
        }
      );

      const data = await this.handleResponse<{ success: boolean; message: Message }>(response);
      
      if (data?.success && data.message) {
        // Replace temp message with real message
        this.notifyMessageReceived(data.message);
        return data.message;
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Update temp message to show error
      tempMessage.status = 'failed';
      this.notifyMessageReceived(tempMessage);
      
      throw error;
    }
  }

  // Notify user status change
  private notifyUserStatusChange(data: any): void {
    // Emit user status change event to subscribers
    console.log('👤 User status changed:', data);
    // You can add logic here to notify components about user status changes
    if (this.userStatusChangeCallback) {
      this.userStatusChangeCallback(data);
    }
  }

  // Notify message received
  private notifyMessageReceived(message: Message): void {
    console.log('📨 Message received notification:', message);
    if (this.messageReceivedCallback) {
      this.messageReceivedCallback(message);
    }
  }

  // Notify message read
  private notifyMessageRead(data: any): void {
    console.log('👁️ Message read notification:', data);
    if (this.messageReadCallback) {
      this.messageReadCallback(data);
    }
  }

  // Notify typing
  private notifyTyping(data: any): void {
    console.log('⌨️ Typing notification:', data);
    if (this.typingCallback) {
      this.typingCallback(data);
    }
  }

  // User status change callback
  private userStatusChangeCallback: ((data: any) => void) | null = null;

  // Message received callback
  private messageReceivedCallback: ((message: Message) => void) | null = null;

  // Message read callback
  private messageReadCallback: ((data: any) => void) | null = null;

  // Typing callback
  private typingCallback: ((data: any) => void) | null = null;

  // Subscribe to user status changes
  onUserStatusChange(callback: (data: any) => void): void {
    this.userStatusChangeCallback = callback;
  }

  // Subscribe to message received
  onMessageReceived(callback: (message: Message) => void): void {
    this.messageReceivedCallback = callback;
  }

  // Subscribe to message read
  onMessageRead(callback: (data: any) => void): void {
    this.messageReadCallback = callback;
  }

  // Subscribe to typing
  onTyping(callback: (data: any) => void): void {
    this.typingCallback = callback;
  }
}

export const messageService = new MessageService();
export default messageService;