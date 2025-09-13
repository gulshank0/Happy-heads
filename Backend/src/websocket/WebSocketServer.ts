import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../generated/client';
import { v4 as uuidv4 } from 'uuid';
import url from 'url';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  id: string;
  userId: string;
  lastPing: number;
  isAlive: boolean;
}

interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

interface ConnectedUser {
  socketId: string;
  userId: string;
  lastSeen: Date;
  socket: AuthenticatedWebSocket;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private conversationRooms: Map<string, Set<string>> = new Map(); // conversationId -> Set of socketIds
  private pingInterval!: NodeJS.Timeout;
  private heartbeatInterval = 30000; // 30 seconds
  private messageQueue: Map<string, WebSocketMessage[]> = new Map(); // userId -> messages

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      clientTracking: true,
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 3,
        },
      },
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupEventHandlers() {
    this.wss.on('connection', async (ws: WebSocket, request) => {
      try {
        const authenticatedWs = await this.authenticateConnection(ws, request);
        if (!authenticatedWs) {
          ws.close(1008, 'Authentication failed');
          return;
        }

        this.handleConnection(authenticatedWs);
      } catch (error) {
        console.error('🔌 WebSocket connection error:', error);
        ws.close(1011, 'Internal server error');
      }
    });

    this.wss.on('error', (error) => {
      console.error('🔌 WebSocket server error:', error);
    });
  }

  private async authenticateConnection(
    ws: WebSocket, 
    request: any
  ): Promise<AuthenticatedWebSocket | null> {
    try {
      const query = url.parse(request.url, true).query;
      const cookies = this.parseCookies(request.headers.cookie || '');
      
      let userId: string | null = null;

      // Try token-based authentication first
      const token = query.token as string;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
          userId = decoded.userId;
        } catch (jwtError) {
          console.log('🔍 JWT verification failed:', jwtError);
        }
      }

      // Try session-based authentication
      if (!userId && cookies['connect.sid']) {
        // This is a simplified session parsing - you might need to implement proper session store integration
        userId = query.userId as string;
      }

      // Try userId from query (for development)
      if (!userId) {
        userId = query.userId as string;
      }

      if (!userId) {
        console.log('❌ No user ID found in authentication');
        return null;
      }

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('❌ User not found in database:', userId);
        return null;
      }

      // Create authenticated WebSocket
      const authenticatedWs = ws as AuthenticatedWebSocket;
      authenticatedWs.id = uuidv4();
      authenticatedWs.userId = userId;
      authenticatedWs.lastPing = Date.now();
      authenticatedWs.isAlive = true;

      console.log('✅ WebSocket authenticated for user:', userId);
      return authenticatedWs;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }

  private parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }

  private handleConnection(ws: AuthenticatedWebSocket) {
    console.log(`🔌 User ${ws.userId} connected with socket ${ws.id}`);

    // Store user connection
    this.connectedUsers.set(ws.id, {
      socketId: ws.id,
      userId: ws.userId,
      lastSeen: new Date(),
      socket: ws
    });
    this.userSockets.set(ws.userId, ws.id);

    // Join user to their conversation rooms
    this.joinUserConversations(ws);

    // Send connection confirmation
    this.sendMessage(ws, {
      type: 'connection-confirmed',
      data: { 
        socketId: ws.id,
        userId: ws.userId,
        timestamp: Date.now()
      }
    });

    // Deliver queued messages
    this.deliverQueuedMessages(ws.userId);

    // Broadcast user online status
    this.broadcastUserStatus(ws.userId, true);

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        this.handleMessage(ws, data);
      } catch (error) {
        console.error('🔌 Message handling error:', error);
        this.sendError(ws, 'message-error', 'Failed to process message');
      }
    });

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastPing = Date.now();
    });

    // Handle disconnection
    ws.on('close', (code, reason) => {
      console.log(`🔌 User ${ws.userId} disconnected:`, { code, reason: reason.toString() });
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`🔌 WebSocket error for user ${ws.userId}:`, error);
      this.handleDisconnection(ws);
    });
  }

  private async joinUserConversations(ws: AuthenticatedWebSocket) {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { user1Id: ws.userId },
            { user2Id: ws.userId }
          ]
        },
        select: { id: true }
      });

      conversations.forEach(conv => {
        this.joinConversationRoom(ws.id, conv.id);
      });

      console.log(`👥 User ${ws.userId} joined ${conversations.length} conversation rooms`);
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }
  }

  private joinConversationRoom(socketId: string, conversationId: string) {
    if (!this.conversationRooms.has(conversationId)) {
      this.conversationRooms.set(conversationId, new Set());
    }
    this.conversationRooms.get(conversationId)!.add(socketId);
  }

  private leaveConversationRoom(socketId: string, conversationId: string) {
    const room = this.conversationRooms.get(conversationId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.conversationRooms.delete(conversationId);
      }
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: any) {
    let message: WebSocketMessage;
    
    try {
      const parsed = JSON.parse(data.toString());
      message = {
        id: parsed.id || uuidv4(),
        type: parsed.type,
        data: parsed.data || {},
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('🔌 Invalid message format:', error);
      this.sendError(ws, 'invalid-format', 'Invalid message format');
      return;
    }

    console.log(`📨 Received message from ${ws.userId}:`, message.type);

    switch (message.type) {
      case 'ping':
        this.handlePing(ws, message);
        break;
      case 'join-conversation':
        this.handleJoinConversation(ws, message);
        break;
      case 'leave-conversation':
        this.handleLeaveConversation(ws, message);
        break;
      case 'send-message':
        this.handleSendMessage(ws, message);
        break;
      case 'typing-start':
        this.handleTypingStart(ws, message);
        break;
      case 'typing-stop':
        this.handleTypingStop(ws, message);
        break;
      case 'mark-as-read':
        this.handleMarkAsRead(ws, message);
        break;
      default:
        console.warn(`🔌 Unknown message type: ${message.type}`);
        this.sendError(ws, 'unknown-type', `Unknown message type: ${message.type}`);
    }
  }

  private handlePing(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    ws.lastPing = Date.now();
    this.sendMessage(ws, {
      type: 'pong',
      data: { timestamp: Date.now() },
      id: message.id
    });
  }

  private handleJoinConversation(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { conversationId } = message.data;
    if (!conversationId) {
      this.sendError(ws, 'missing-data', 'Conversation ID required');
      return;
    }

    this.joinConversationRoom(ws.id, conversationId);
    this.sendMessage(ws, {
      type: 'conversation-joined',
      data: { conversationId },
      id: message.id
    });
  }

  private handleLeaveConversation(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { conversationId } = message.data;
    if (!conversationId) {
      this.sendError(ws, 'missing-data', 'Conversation ID required');
      return;
    }

    this.leaveConversationRoom(ws.id, conversationId);
    this.sendMessage(ws, {
      type: 'conversation-left',
      data: { conversationId },
      id: message.id
    });
  }

  private async handleSendMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      const { conversationId, receiverId, content, messageType = 'TEXT' } = message.data;

      if (!conversationId || !receiverId || !content) {
        this.sendError(ws, 'missing-data', 'Missing required message data');
        return;
      }

      // Verify user is part of conversation
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
        this.sendError(ws, 'unauthorized', 'Not authorized for this conversation');
        return;
      }

      // Create message in database
      const dbMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: ws.userId,
          receiverId,
          content,
          messageType,
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
      });

      // Update conversation last message time
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      const formattedMessage = {
        id: dbMessage.id,
        senderId: dbMessage.senderId,
        receiverId: dbMessage.receiverId,
        content: dbMessage.content,
        messageType: dbMessage.messageType,
        timestamp: dbMessage.createdAt.toISOString(),
        isRead: dbMessage.isRead,
        sender: dbMessage.sender
      };

      // Send to conversation room
      this.broadcastToConversation(conversationId, {
        type: 'new-message',
        data: {
          message: formattedMessage,
          conversationId
        }
      }, ws.id); // Exclude sender

      // Send confirmation to sender
      this.sendMessage(ws, {
        type: 'message-sent',
        data: {
          message: formattedMessage,
          conversationId
        },
        id: message.id
      });

      // Send notification to receiver if offline
      const receiverSocketId = this.userSockets.get(receiverId);
      if (!receiverSocketId) {
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
      console.error('Send message error:', error);
      this.sendError(ws, 'send-failed', 'Failed to send message');
    }
  }

  private handleTypingStart(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { conversationId } = message.data;
    if (!conversationId) {
      this.sendError(ws, 'missing-data', 'Conversation ID required');
      return;
    }

    this.broadcastToConversation(conversationId, {
      type: 'user-typing',
      data: {
        userId: ws.userId,
        conversationId,
        typing: true
      }
    }, ws.id);
  }

  private handleTypingStop(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { conversationId } = message.data;
    if (!conversationId) {
      this.sendError(ws, 'missing-data', 'Conversation ID required');
      return;
    }

    this.broadcastToConversation(conversationId, {
      type: 'user-typing',
      data: {
        userId: ws.userId,
        conversationId,
        typing: false
      }
    }, ws.id);
  }

  private async handleMarkAsRead(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      const { conversationId } = message.data;
      if (!conversationId) {
        this.sendError(ws, 'missing-data', 'Conversation ID required');
        return;
      }

      // Verify user is part of conversation
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
        this.sendError(ws, 'unauthorized', 'Not authorized for this conversation');
        return;
      }

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: ws.userId,
          isRead: false
        },
        data: { isRead: true }
      });

      // Broadcast read receipt
      this.broadcastToConversation(conversationId, {
        type: 'messages-read',
        data: {
          conversationId,
          readBy: ws.userId
        }
      });

      // Send confirmation
      this.sendMessage(ws, {
        type: 'marked-as-read',
        data: { conversationId },
        id: message.id
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      this.sendError(ws, 'mark-read-failed', 'Failed to mark as read');
    }
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: Partial<WebSocketMessage>) {
    if (ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        id: message.id || uuidv4(),
        type: message.type || 'unknown',
        data: message.data || {},
        timestamp: message.timestamp || Date.now()
      };

      try {
        ws.send(JSON.stringify(fullMessage));
      } catch (error) {
        console.error(`Failed to send message to ${ws.userId}:`, error);
      }
    }
  }

  private sendError(ws: AuthenticatedWebSocket, errorType: string, errorMessage: string) {
    this.sendMessage(ws, {
      type: 'error',
      data: {
        errorType,
        message: errorMessage,
        timestamp: Date.now()
      }
    });
  }

  private broadcastToConversation(
    conversationId: string, 
    message: Partial<WebSocketMessage>, 
    excludeSocketId?: string
  ) {
    const room = this.conversationRooms.get(conversationId);
    if (!room) return;

    room.forEach(socketId => {
      if (socketId === excludeSocketId) return;
      
      const userConnection = this.connectedUsers.get(socketId);
      if (userConnection && userConnection.socket.readyState === WebSocket.OPEN) {
        this.sendMessage(userConnection.socket, message);
      }
    });
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    const statusMessage = {
      type: 'user-status-changed',
      data: {
        userId,
        isOnline,
        lastSeen: new Date().toISOString()
      }
    };

    this.connectedUsers.forEach(({ socket }) => {
      if (socket.readyState === WebSocket.OPEN) {
        this.sendMessage(socket, statusMessage);
      }
    });
  }

  private queueMessage(userId: string, message: Partial<WebSocketMessage>) {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    
    const queue = this.messageQueue.get(userId)!;
    const fullMessage: WebSocketMessage = {
      id: message.id || uuidv4(),
      type: message.type || 'unknown',
      data: message.data || {},
      timestamp: message.timestamp || Date.now()
    };
    
    queue.push(fullMessage);
    
    // Limit queue size
    if (queue.length > 100) {
      queue.shift();
    }
  }

  private deliverQueuedMessages(userId: string) {
    const queue = this.messageQueue.get(userId);
    if (!queue || queue.length === 0) return;

    const socketId = this.userSockets.get(userId);
    if (!socketId) return;

    const userConnection = this.connectedUsers.get(socketId);
    if (!userConnection || userConnection.socket.readyState !== WebSocket.OPEN) return;

    console.log(`📬 Delivering ${queue.length} queued messages to ${userId}`);
    
    queue.forEach(message => {
      this.sendMessage(userConnection.socket, message);
    });

    // Clear the queue
    this.messageQueue.delete(userId);
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    // Remove from all conversation rooms
    this.conversationRooms.forEach((room, conversationId) => {
      if (room.has(ws.id)) {
        room.delete(ws.id);
        if (room.size === 0) {
          this.conversationRooms.delete(conversationId);
        }
      }
    });

    // Remove from connected users
    this.connectedUsers.delete(ws.id);
    this.userSockets.delete(ws.userId);

    // Broadcast user offline status
    this.broadcastUserStatus(ws.userId, false);
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      this.connectedUsers.forEach(({ socket }) => {
        if (!socket.isAlive) {
          console.log(`💔 Terminating inactive connection for user ${socket.userId}`);
          socket.terminate();
          return;
        }

        socket.isAlive = false;
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping();
        }
      });
    }, this.heartbeatInterval);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getConnectionCount(): number {
    return this.connectedUsers.size;
  }

  public getUserConnectionInfo(userId: string) {
    const socketId = this.userSockets.get(userId);
    if (!socketId) return null;
    
    const connection = this.connectedUsers.get(socketId);
    return connection ? {
      socketId: connection.socketId,
      lastSeen: connection.lastSeen,
      lastPing: connection.socket.lastPing
    } : null;
  }

  public close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.connectedUsers.forEach(({ socket }) => {
      socket.close(1001, 'Server shutting down');
    });
    
    this.wss.close();
  }
}

export default WebSocketManager;