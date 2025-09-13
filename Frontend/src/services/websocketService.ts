import { Message, Conversation } from './messageService';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

interface ConnectionOptions {
  userId: string;
  token?: string;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

interface WebSocketEvents {
  'connect': () => void;
  'disconnect': (data: { code: number; reason: string }) => void;
  'reconnecting': (data: { attempt: number; maxAttempts: number }) => void;
  'reconnected': () => void;
  'reconnect-failed': () => void;
  'new-message': (data: { message: Message; conversationId: string }) => void;
  'message-sent': (data: { message: Message; conversationId: string }) => void;
  'message-notification': (data: { message: Message; conversationId: string; senderId: string }) => void;
  'user-typing': (data: { userId: string; conversationId: string; typing: boolean }) => void;
  'messages-read': (data: { conversationId: string; readBy: string }) => void;
  'user-status-changed': (data: { userId: string; isOnline: boolean; lastSeen: string }) => void;
  'online-users': (data: { users: string[] }) => void;
  'conversation-joined': (data: { conversationId: string }) => void;
  'conversation-left': (data: { conversationId: string }) => void;
  'error': (data: { errorType: string; message: string; timestamp: number }) => void;
  'connection-ack': (data: { connectionId: string; userId: string; timestamp: number }) => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private currentUserId: string | null = null;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;

  async connect(options: ConnectionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log('✅ WebSocket already connected');
          resolve();
          return;
        }

        this.connectionState = 'connecting';
        this.currentUserId = options.userId;

        // Clear any existing reconnect timeout
        if (this.reconnectTimeoutId) {
          clearTimeout(this.reconnectTimeoutId);
          this.reconnectTimeoutId = null;
        }

        // Build WebSocket URL
        const baseUrl = import.meta.env.VITE_API_URL || '{process.env.FRONTEND_URL}';
        if (!baseUrl) {
          throw new Error('API base URL is not defined');
        }
        const wsUrl = baseUrl.replace('http', 'ws') + '/ws';
        const url = new URL(wsUrl);
        url.searchParams.set('userId', options.userId);
        if (options.token) {
          url.searchParams.set('token', options.token);
        }

        console.log('🔌 Connecting to WebSocket:', url.toString());

        this.ws = new WebSocket(url.toString());

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.connectionState === 'connecting') {
            console.error('❌ WebSocket connection timeout');
            this.ws?.close();
            this.connectionState = 'failed';
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected');
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connect', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.connectionState = 'disconnected';
          this.stopHeartbeat();
          this.emit('disconnect', { code: event.code, reason: event.reason });
          
          // Auto-reconnect if not manually closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(options);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.connectionState = 'failed';
            this.emit('reconnect-failed', {});
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ WebSocket error:', error);
          this.connectionState = 'failed';
          this.emit('error', { error });
          reject(error);
        };

      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        this.connectionState = 'failed';
        reject(error);
      }
    });
  }

  private scheduleReconnect(options: ConnectionOptions): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`);
    
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    });

    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        await this.connect(options);
        this.emit('reconnected', { attempt: this.reconnectAttempts });
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, this.reconnectInterval);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private send(type: string, data: any = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent WebSocket message:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message:', type);
    }
  }

  // Send chat message
  async sendChatMessage(message: {
    conversationId?: string;
    receiverId: string;
    content: string;
    messageType: string;
  }): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    console.log('📤 Sending message via WebSocket:', message);
    this.send('send_message', message);
  }

  // Join conversation room
  joinConversation(conversationId: string): void {
    if (this.isConnected()) {
      console.log('🏠 Joining conversation:', conversationId);
      this.send('join_conversation', { conversationId });
    }
  }

  // Leave conversation room
  leaveConversation(conversationId: string): void {
    if (this.isConnected()) {
      console.log('🚪 Leaving conversation:', conversationId);
      this.send('leave_conversation', { conversationId });
    }
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    if (this.isConnected()) {
      this.send('mark_as_read', { conversationId });
    }
  }

  // Send typing indicator
  sendTyping(conversationId: string, typing: boolean): void {
    if (this.isConnected()) {
      this.send('user_typing', { conversationId, typing });
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const { type, data } = message;
    
    switch (type) {
      case 'connection_ack':
        console.log('✅ Connection acknowledged:', data);
        this.emit('connection-ack', data);
        break;
        
      case 'message_received':
        console.log('📨 New message received:', data);
        this.emit('new-message', data);
        break;
        
      case 'message_sent':
        console.log('📤 Message sent confirmation:', data);
        this.emit('message-sent', data);
        break;
        
      case 'messages_read':
        this.emit('messages-read', data);
        break;
        
      case 'user_typing':
        this.emit('user-typing', data);
        break;
        
      case 'user_status_changed':
        this.emit('user-status-changed', data);
        break;
        
      case 'conversation_joined':
        this.emit('conversation-joined', data);
        break;
        
      case 'conversation_left':
        this.emit('conversation-left', data);
        break;
        
      case 'error':
        console.error('❌ WebSocket server error:', data);
        this.emit('error', data);
        break;
        
      case 'pong':
        // Heartbeat response - no action needed
        break;
        
      default:
        console.log('🔔 Unknown message type:', type, data);
    }
  }

  // Event listener management
  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in event listener:', error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
    this.currentUserId = null;
    this.reconnectAttempts = 0;
  }
}

export default new WebSocketService();