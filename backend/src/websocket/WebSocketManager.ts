import WebSocket from 'ws';
import { Server as HTTPServer } from 'http';
import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, MessageType } from '../../generated/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  id: string;
  userId: string;
  user: any;
  isAlive: boolean;
  rooms: Set<string>;
  lastHeartbeat: number;
}

interface ConnectionInfo {
  id: string;
  userId: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  roomCount: number;
  messagesSent: number;
  messagesReceived: number;
}

interface WebSocketMessage {
  id?: string;
  type: string;
  data?: any;
  timestamp?: number;
  conversationId?: string;
  error?: string;
}

interface SendMessageData {
  conversationId: string;
  receiverId: string;
  content: string;
  messageType?: string;
}

export default class WebSocketManager {
  private wss: WebSocket.Server;
  private connections: Map<string, AuthenticatedWebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> socketIds
  private heartbeatInterval!: NodeJS.Timeout;
  private connectionInfo: Map<string, ConnectionInfo> = new Map();
  private messageQueue: Map<string, WebSocketMessage[]> = new Map(); // userId -> pending messages
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 3
        }
      }
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
    this.startCleanupTasks();

    console.log('🔌 WebSocket server initialized');
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
      try {
        const parsedUrl = parseUrl(req.url || '', true);
        const { userId, token } = parsedUrl.query;

        console.log('🔍 WebSocket connection attempt:', { userId, hasToken: !!token });

        // Validate connection parameters
        if (!userId) {
          this.closeWithError(ws, 4001, 'Missing userId parameter');
          return;
        }

        // Authenticate user
        const user = await this.authenticateUser(token as string, userId as string);
        if (!user) {
          this.closeWithError(ws, 4003, 'Authentication failed');
          return;
        }

        // Check rate limiting
        if (!this.checkRateLimit(userId as string)) {
          this.closeWithError(ws, 4029, 'Too many connection attempts');
          return;
        }

        // Setup authenticated connection
        const connectionId = uuidv4();
        const authenticatedWs = this.setupAuthenticatedConnection(ws, connectionId, userId as string, user);

        console.log(`✅ User ${userId} connected with socket ${connectionId}`);

        // Send connection acknowledgment
        this.sendMessage(authenticatedWs, {
          type: 'connection-ack',
          data: {
            connectionId,
            userId,
            timestamp: Date.now()
          }
        });

        // Join user to their rooms
        await this.joinUserRooms(authenticatedWs);

        // Send queued messages
        this.sendQueuedMessages(userId as string);

        // Broadcast user online status
        this.broadcastUserStatus(userId as string, true);

      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
        this.closeWithError(ws, 4000, 'Internal server error');
      }
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });
  }

  private async authenticateUser(token: string, userId: string): Promise<any> {
    try {
      console.log('🔐 Authenticating user:', { userId, hasToken: !!token });

      // First, verify the user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      });

      if (!user) {
        console.error('❌ User not found:', userId);
        return null;
      }

      // Try JWT token authentication if provided
      if (token && token !== 'null' && token !== 'undefined' && token !== 'no-token') {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
          console.log('🔐 JWT decoded:', { decodedUserId: decoded.userId, providedUserId: userId });
          
          if (decoded.userId === userId) {
            console.log('✅ JWT authentication successful');
            return user;
          } else {
            console.warn('⚠️ JWT userId mismatch');
          }
        } catch (jwtError) {
          console.error('❌ JWT verification failed:', jwtError);
        }
      }

      // For development/testing: allow connection with just valid userId
      // In production, you should enforce proper token authentication
      if (process.env.NODE_ENV === 'development' || process.env.ALLOW_WEBSOCKET_WITHOUT_TOKEN === 'true') {
        console.log('⚠️ Development mode: allowing connection without valid JWT');
        return user;
      }

      console.error('❌ Authentication failed: no valid token');
      return null;

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimiter.get(userId);

    if (!limit || now > limit.resetTime) {
      this.rateLimiter.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return true;
    }

    if (limit.count >= 10) { // Max 10 connections per minute
      return false;
    }

    limit.count++;
    return true;
  }

  private setupAuthenticatedConnection(
    ws: WebSocket, 
    connectionId: string, 
    userId: string, 
    user: any
  ): AuthenticatedWebSocket {
    const authenticatedWs = ws as AuthenticatedWebSocket;
    authenticatedWs.id = connectionId;
    authenticatedWs.userId = userId;
    authenticatedWs.user = user;
    authenticatedWs.isAlive = true;
    authenticatedWs.rooms = new Set();
    authenticatedWs.lastHeartbeat = Date.now();

    // Store connection
    this.connections.set(connectionId, authenticatedWs);
    
    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Store connection info
    this.connectionInfo.set(connectionId, {
      id: connectionId,
      userId,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      roomCount: 0,
      messagesSent: 0,
      messagesReceived: 0
    });

    // Setup event handlers
    this.setupConnectionHandlers(authenticatedWs);

    return authenticatedWs;
  }

  private setupConnectionHandlers(ws: AuthenticatedWebSocket): void {
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        await this.handleMessage(ws, data);
      } catch (error) {
        console.error('❌ Message handling error:', error);
        this.sendError(ws, 'MESSAGE_ERROR', 'Failed to process message');
      }
    });

    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastHeartbeat = Date.now();
      
      const info = this.connectionInfo.get(ws.id);
      if (info) {
        info.lastHeartbeat = new Date();
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      const reasonString = reason.toString();
      console.log(`🔌 User ${ws.userId} disconnected: ${code} - ${reasonString}`);
      this.handleDisconnection(ws, code, reasonString);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for user ${ws.userId}:`, error);
      this.handleDisconnection(ws, 1011, 'Connection error');
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: WebSocket.Data): Promise<void> {
    let message: WebSocketMessage;

    try {
      const messageString = data.toString();
      message = JSON.parse(messageString);
    } catch (error) {
      this.sendError(ws, 'PARSE_ERROR', 'Invalid JSON format');
      return;
    }

    // Validate message structure
    if (!this.validateMessage(message)) {
      this.sendError(ws, 'VALIDATION_ERROR', 'Invalid message format');
      return;
    }

    // Update message stats
    const info = this.connectionInfo.get(ws.id);
    if (info) {
      info.messagesReceived++;
    }

    console.log(`📨 Received message from ${ws.userId}:`, message.type);

    // Handle different message types
    switch (message.type) {
      case 'ping':
        this.handlePing(ws);
        break;

      case 'join-conversation':
        await this.handleJoinConversation(ws, message.data?.conversationId);
        break;

      case 'leave-conversation':
        await this.handleLeaveConversation(ws, message.data?.conversationId);
        break;

      case 'send-message':
        await this.handleSendMessage(ws, message.data);
        break;

      case 'typing-start':
        await this.handleTypingStart(ws, message.data?.conversationId);
        break;

      case 'typing-stop':
        await this.handleTypingStop(ws, message.data?.conversationId);
        break;

      case 'mark-as-read':
        await this.handleMarkAsRead(ws, message.data?.conversationId);
        break;

      case 'get-online-users':
        this.handleGetOnlineUsers(ws);
        break;

      default:
        this.sendError(ws, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
    }
  }

  private validateMessage(message: any): message is WebSocketMessage {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      message.type.length > 0
    );
  }

  private validateSendMessageData(data: any): data is SendMessageData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.conversationId === 'string' &&
      typeof data.receiverId === 'string' &&
      typeof data.content === 'string' &&
      data.content.trim().length > 0 &&
      data.content.length <= 10000 // Max message length
    );
  }

  private handlePing(ws: AuthenticatedWebSocket): void {
    this.sendMessage(ws, {
      type: 'pong',
      timestamp: Date.now()
    });
  }

  private async handleJoinConversation(ws: AuthenticatedWebSocket, conversationId: string): Promise<void> {
    if (!conversationId) {
      this.sendError(ws, 'INVALID_CONVERSATION_ID', 'Conversation ID is required');
      return;
    }

    try {
      // Verify user has access to conversation - Use consistent model name
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { user1Id: ws.userId },
            { user2Id: ws.userId }
          ]
        }
      });

      if (!conversation) {
        this.sendError(ws, 'CONVERSATION_NOT_FOUND', 'Conversation not found or access denied');
        return;
      }

      const roomId = `conversation:${conversationId}`;
      this.joinRoom(ws, roomId);

      this.sendMessage(ws, {
        type: 'conversation-joined',
        data: { conversationId }
      });

      console.log(`👥 User ${ws.userId} joined conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ Join conversation error:', error);
      this.sendError(ws, 'JOIN_CONVERSATION_ERROR', 'Failed to join conversation');
    }
  }

  private async handleLeaveConversation(ws: AuthenticatedWebSocket, conversationId: string): Promise<void> {
    if (!conversationId) {
      this.sendError(ws, 'INVALID_CONVERSATION_ID', 'Conversation ID is required');
      return;
    }

    const roomId = `conversation:${conversationId}`;
    this.leaveRoom(ws, roomId);

    this.sendMessage(ws, {
      type: 'conversation-left',
      data: { conversationId }
    });

    console.log(`👋 User ${ws.userId} left conversation ${conversationId}`);
  }

  private async handleSendMessage(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!this.validateSendMessageData(data)) {
      this.sendError(ws, 'INVALID_MESSAGE_DATA', 'Invalid message data');
      return;
    }

    const { conversationId, receiverId, content, messageType = 'TEXT' } = data;

    try {
      // Verify conversation access - Use consistent model name
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { user1Id: ws.userId },
            { user2Id: ws.userId }
          ]
        }
      });

      if (!conversation) {
        this.sendError(ws, 'CONVERSATION_NOT_FOUND', 'Conversation not found or access denied');
        return;
      }

      // Verify receiver is part of conversation
      if (receiverId !== conversation.user1Id && receiverId !== conversation.user2Id) {
        this.sendError(ws, 'INVALID_RECEIVER', 'Receiver is not part of this conversation');
        return;
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: ws.userId,
          receiverId,
          content,
          messageType: messageType as MessageType,
          isDelivered: true
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }) as any;

      // Update conversation last message time - Use consistent model name
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      const formattedMessage = {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        messageType: message.messageType,
        timestamp: message.createdAt.toISOString(),
        isRead: message.isRead,
        sender: message.sender
      };

      // Send to conversation room
      this.broadcastToRoom(`conversation:${conversationId}`, {
        type: 'new-message',
        data: {
          message: formattedMessage,
          conversationId
        }
      });

      // Send confirmation to sender
      this.sendMessage(ws, {
        type: 'message-sent',
        data: {
          message: formattedMessage,
          conversationId
        }
      });

      // Send notification to receiver if not in conversation room
      const receiverConnections = this.userConnections.get(receiverId);
      if (receiverConnections) {
        for (const connectionId of receiverConnections) {
          const receiverWs = this.connections.get(connectionId);
          if (receiverWs && !receiverWs.rooms.has(`conversation:${conversationId}`)) {
            this.sendMessage(receiverWs, {
              type: 'message-notification',
              data: {
                message: formattedMessage,
                conversationId,
                senderId: ws.userId
              }
            });
          }
        }
      } else {
        // Queue message for offline user
        this.queueMessage(receiverId, {
          type: 'message-notification',
          data: {
            message: formattedMessage,
            conversationId,
            senderId: ws.userId
          }
        });
      }

      console.log(`📨 Message sent in conversation ${conversationId}`);

    } catch (error) {
      console.error('❌ Send message error:', error);
      this.sendError(ws, 'SEND_MESSAGE_ERROR', 'Failed to send message');
    }
  }

  private async handleTypingStart(ws: AuthenticatedWebSocket, conversationId: string): Promise<void> {
    if (!conversationId) {
      this.sendError(ws, 'INVALID_CONVERSATION_ID', 'Conversation ID is required');
      return;
    }

    this.broadcastToRoom(`conversation:${conversationId}`, {
      type: 'user-typing',
      data: {
        userId: ws.userId,
        conversationId,
        typing: true
      }
    }, [ws.id]); // Exclude sender
  }

  private async handleTypingStop(ws: AuthenticatedWebSocket, conversationId: string): Promise<void> {
    if (!conversationId) {
      this.sendError(ws, 'INVALID_CONVERSATION_ID', 'Conversation ID is required');
      return;
    }

    this.broadcastToRoom(`conversation:${conversationId}`, {
      type: 'user-typing',
      data: {
        userId: ws.userId,
        conversationId,
        typing: false
      }
    }, [ws.id]); // Exclude sender
  }

  private async handleMarkAsRead(ws: AuthenticatedWebSocket, conversationId: string): Promise<void> {
    if (!conversationId) {
      this.sendError(ws, 'INVALID_CONVERSATION_ID', 'Conversation ID is required');
      return;
    }

    try {
      // Verify conversation access - Use consistent model name
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { user1Id: ws.userId },
            { user2Id: ws.userId }
          ]
        }
      });

      if (!conversation) {
        this.sendError(ws, 'CONVERSATION_NOT_FOUND', 'Conversation not found or access denied');
        return;
      }

      // Mark messages as read
      const updatedMessages = await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: ws.userId,
          isRead: false
        },
        data: { isRead: true }
      });

      console.log(`👁️ Marked ${updatedMessages.count} messages as read in conversation ${conversationId}`);

      // Broadcast read receipt
      this.broadcastToRoom(`conversation:${conversationId}`, {
        type: 'messages-read',
        data: {
          conversationId,
          readBy: ws.userId,
          count: updatedMessages.count
        }
      });

      // Send confirmation to sender
      this.sendMessage(ws, {
        type: 'mark-read-success',
        data: {
          conversationId,
          count: updatedMessages.count
        }
      });

    } catch (error) {
      console.error('❌ Mark as read error:', error);
      this.sendError(ws, 'MARK_READ_ERROR', 'Failed to mark messages as read');
    }
  }

  private handleGetOnlineUsers(ws: AuthenticatedWebSocket): void {
    const onlineUsers = Array.from(this.userConnections.keys());
    this.sendMessage(ws, {
      type: 'online-users',
      data: { users: onlineUsers }
    });
  }

  private async joinUserRooms(ws: AuthenticatedWebSocket): Promise<void> {
    try {
      // Join personal room
      this.joinRoom(ws, `user:${ws.userId}`);

      // Join conversation rooms - Use consistent model name
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { user1Id: ws.userId },
            { user2Id: ws.userId }
          ]
        },
        select: { id: true }
      });

      conversations.forEach((conv: { id: string }) => {
        this.joinRoom(ws, `conversation:${conv.id}`);
      });

      console.log(`👥 User ${ws.userId} joined ${conversations.length + 1} rooms`);

    } catch (error) {
      console.error('❌ Error joining user rooms:', error);
    }
  }

  private joinRoom(ws: AuthenticatedWebSocket, roomId: string): void {
    ws.rooms.add(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(ws.id);

    const info = this.connectionInfo.get(ws.id);
    if (info) {
      info.roomCount = ws.rooms.size;
    }
  }

  private leaveRoom(ws: AuthenticatedWebSocket, roomId: string): void {
    ws.rooms.delete(roomId);

    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(ws.id);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    const info = this.connectionInfo.get(ws.id);
    if (info) {
      info.roomCount = ws.rooms.size;
    }
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const messageWithId = {
          ...message,
          id: message.id || uuidv4(),
          timestamp: message.timestamp || Date.now()
        };

        ws.send(JSON.stringify(messageWithId));

        const info = this.connectionInfo.get(ws.id);
        if (info) {
          info.messagesSent++;
        }
      } catch (error) {
        console.error(`❌ Failed to send message to ${ws.userId}:`, error);
      }
    }
  }

  private sendError(ws: AuthenticatedWebSocket, errorType: string, message: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: {
        errorType,
        message,
        timestamp: Date.now()
      }
    });
  }

  private broadcastToRoom(roomId: string, message: WebSocketMessage, excludeIds: string[] = []): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(connectionId => {
      if (excludeIds.includes(connectionId)) return;

      const ws = this.connections.get(connectionId);
      if (ws) {
        this.sendMessage(ws, message);
      }
    });
  }

  private broadcastUserStatus(userId: string, isOnline: boolean): void {
    const message: WebSocketMessage = {
      type: 'user-status-changed',
      data: {
        userId,
        isOnline,
        lastSeen: new Date().toISOString()
      }
    };

    // Broadcast to all connections
    this.connections.forEach(ws => {
      if (ws.userId !== userId) { // Don't send to the user themselves
        this.sendMessage(ws, message);
      }
    });
  }

  private queueMessage(userId: string, message: WebSocketMessage): void {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }

    const queue = this.messageQueue.get(userId)!;
    queue.push(message);

    // Limit queue size
    if (queue.length > 100) {
      queue.shift();
    }
  }

  private sendQueuedMessages(userId: string): void {
    const queue = this.messageQueue.get(userId);
    if (!queue || queue.length === 0) return;

    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return;

    // Send to first available connection
    for (const connectionId of userConnections) {
      const ws = this.connections.get(connectionId);
      if (ws) {
        queue.forEach(message => {
          this.sendMessage(ws, message);
        });
        break;
      }
    }

    // Clear queue
    this.messageQueue.delete(userId);
  }

  private handleDisconnection(ws: AuthenticatedWebSocket, code: number, reason: string): void {
    // Remove from connections
    this.connections.delete(ws.id);
    this.connectionInfo.delete(ws.id);

    // Remove from user connections
    const userConnections = this.userConnections.get(ws.userId);
    if (userConnections) {
      userConnections.delete(ws.id);
      if (userConnections.size === 0) {
        this.userConnections.delete(ws.userId);
        // User is completely offline
        this.broadcastUserStatus(ws.userId, false);
      }
    }

    // Remove from all rooms
    ws.rooms.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.delete(ws.id);
        if (room.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });

    console.log(`🔌 User ${ws.userId} fully disconnected (${code}: ${reason})`);
  }

  private closeWithError(ws: WebSocket, code: number, reason: string): void {
    try {
      ws.close(code, reason);
    } catch (error) {
      console.error('❌ Error closing WebSocket:', error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      this.connections.forEach((ws, connectionId) => {
        if (!ws.isAlive || (now - ws.lastHeartbeat) > 60000) { // 1 minute timeout
          console.log(`💀 Terminating inactive connection: ${connectionId}`);
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Every 30 seconds
  }

  private startCleanupTasks(): void {
    // Clean rate limiter every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [userId, limit] of this.rateLimiter.entries()) {
        if (now > limit.resetTime) {
          this.rateLimiter.delete(userId);
        }
      }
    }, 300000); // 5 minutes

    // Clean old message queues every 10 minutes
    setInterval(() => {
      for (const [userId, queue] of this.messageQueue.entries()) {
        if (!this.userConnections.has(userId) && queue.length === 0) {
          this.messageQueue.delete(userId);
        }
      }
    }, 600000); // 10 minutes
  }

  // Public methods for monitoring
  public getConnectedUsers(): string[] {
    return Array.from(this.userConnections.keys());
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  public getUserConnectionInfo(userId: string): ConnectionInfo | null {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections || userConnections.size === 0) return null;

    const connectionId = Array.from(userConnections)[0];
    return this.connectionInfo.get(connectionId) || null;
  }

  public getRoomInfo(): { roomId: string; userCount: number }[] {
    return Array.from(this.rooms.entries()).map(([roomId, connections]) => ({
      roomId,
      userCount: connections.size
    }));
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.connections.forEach(ws => {
      ws.close(1001, 'Server shutting down');
    });

    this.wss.close();
    console.log('🔌 WebSocket server closed');
  }
}