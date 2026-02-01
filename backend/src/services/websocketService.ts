import WebSocket from 'ws';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '../../generated/client';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userData?: any;
  isAlive?: boolean;
  id?: string;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
  id?: string;
}

class WebSocketService {
  private wss: WebSocket.Server | null = null;
  private connectedUsers: Map<string, AuthenticatedWebSocket> = new Map();
  private userSockets: Map<WebSocket, string> = new Map();

  initialize(server: HTTPServer) {
    interface WebSocketVerifyClientInfo {
      origin: string;
      secure: boolean;
      req: any;
    }

    interface WebSocketServerOptions {
      server: HTTPServer;
      path: string;
      verifyClient: (info: WebSocketVerifyClientInfo) => Promise<boolean>;
    }

        this.wss = new WebSocket.Server({
          server,
          path: '/ws',
          verifyClient: async (info: WebSocketVerifyClientInfo): Promise<boolean> => {
            try {
              const query = url.parse(info.req.url!, true).query;
              const userId: string = query.userId as string;

              console.log('🔍 WebSocket verification for userId:', userId);

              if (!userId) {
                console.log('❌ WebSocket connection rejected: No userId provided');
                return false;
              }

              // Verify user exists in database
              const user = await prisma.user.findUnique({
                where: { id: userId }
              });

              if (!user) {
                console.log('❌ WebSocket connection rejected: User not found:', userId);
                return false;
              }

              console.log('✅ WebSocket connection verified for user:', user.name);
              return true;
            } catch (error) {
              console.error('❌ WebSocket verification error:', error);
              return false;
            }
          }
        } as WebSocketServerOptions);

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      this.handleConnection(ws, req);
    });

    // Heartbeat mechanism
    const interval = setInterval(() => {
      this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log('💀 Terminating dead WebSocket connection for user:', ws.userId);
          this.cleanupConnection(ws);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    console.log('✅ WebSocket service initialized on /ws');
  }

  private async handleConnection(ws: AuthenticatedWebSocket, req: any) {
    try {
      const query = url.parse(req.url, true).query;
      const userId = query.userId as string;

      // Get user data from database
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
        console.log('❌ User not found during connection:', userId);
        ws.close(1008, 'User not found');
        return;
      }

      // Setup WebSocket properties
      ws.userId = userId;
      ws.userData = user;
      ws.isAlive = true;
      ws.id = uuidv4();

      console.log(`✅ User ${user.name} (${userId}) connected via WebSocket`);

      // Store connection mappings
      this.connectedUsers.set(userId, ws);
      this.userSockets.set(ws, userId);

      // Send connection acknowledgment
      this.sendToSocket(ws, {
        type: 'connection_ack',
        data: {
          connectionId: ws.id,
          userId: userId,
          timestamp: Date.now(),
          user: user
        }
      });

      // Broadcast user online status
      this.broadcastUserStatus(userId, true);

      // Setup message handlers
      this.setupMessageHandlers(ws);

      // Handle WebSocket events
      ws.on('close', (code, reason) => {
        console.log(`❌ User ${userId} disconnected - Code: ${code}, Reason: ${reason}`);
        this.cleanupConnection(ws);
        this.broadcastUserStatus(userId, false);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for user ${userId}:`, error);
        this.cleanupConnection(ws);
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

    } catch (error) {
      console.error('❌ Error handling WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  private cleanupConnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      this.connectedUsers.delete(ws.userId);
    }
    this.userSockets.delete(ws);
  }

  private setupMessageHandlers(ws: AuthenticatedWebSocket) {
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        console.log(`📨 Received WebSocket message from ${ws.userId}:`, data.type);

        switch (data.type) {
          case 'send_message':
            await this.handleSendMessage(ws, data.data);
            break;
          
          case 'join_conversation':
            this.handleJoinConversation(ws, data.data);
            break;
          
          case 'leave_conversation':
            this.handleLeaveConversation(ws, data.data);
            break;
          
          case 'mark_as_read':
            await this.handleMarkAsRead(ws, data.data);
            break;
          
          case 'user_typing':
            this.handleUserTyping(ws, data.data);
            break;
          
          case 'ping':
            this.sendToSocket(ws, { type: 'pong', timestamp: Date.now() });
            break;
          
          default:
            console.log(`🔔 Unknown WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        this.sendToSocket(ws, {
          type: 'error',
          data: {
            errorType: 'MESSAGE_PROCESSING_ERROR',
            message: 'Failed to process message',
            timestamp: Date.now()
          }
        });
      }
    });
  }

  private async handleSendMessage(ws: AuthenticatedWebSocket, data: any) {
    const { conversationId, receiverId, content, messageType = 'TEXT' } = data;
    const senderId = ws.userId!;

    console.log('💬 Processing WebSocket message:', {
      senderId,
      receiverId,
      conversationId,
      contentLength: content?.length,
      messageType
    });

    try {
      // Validate input
      if (!receiverId || !content?.trim()) {
        throw new Error('Receiver ID and content are required');
      }

      if (senderId === receiverId) {
        throw new Error('Cannot send message to yourself');
      }

      // Check if receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, name: true }
      });

      if (!receiver) {
        throw new Error('Receiver not found');
      }

      console.log('✅ Receiver found:', receiver.name);

      // Find or create conversation
      let conversation;
      
      if (conversationId) {
        conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { user1Id: senderId, user2Id: receiverId },
              { user1Id: receiverId, user2Id: senderId }
            ]
          }
        });
        
        if (!conversation) {
          throw new Error('Conversation not found');
        }
      } else {
        conversation = await prisma.conversation.findFirst({
          where: {
            OR: [
              { user1Id: senderId, user2Id: receiverId },
              { user1Id: receiverId, user2Id: senderId }
            ]
          }
        });

        if (!conversation) {
          console.log('📝 Creating new conversation');
          conversation = await prisma.conversation.create({
            data: {
              user1Id: senderId,
              user2Id: receiverId,
              lastMessageAt: new Date()
            }
          });
          console.log('✅ New conversation created:', conversation.id);
        }
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: senderId,
          receiverId: receiverId,
          content: content.trim(),
          messageType: messageType,
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

      console.log('✅ Message saved to database:', message.id);

      // Update conversation's last message time
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });

      // Format message for WebSocket response
      const formattedMessage = {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        messageType: message.messageType,
        timestamp: message.createdAt.toISOString(),
        isRead: message.isRead,
        conversationId: message.conversationId,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          avatar: message.sender.avatar
        }
      };

      // Send confirmation to sender
      this.sendToSocket(ws, {
        type: 'message_sent',
        data: {
          message: formattedMessage,
          conversationId: conversation.id
        }
      });

      // Send to receiver if online
      const receiverWs = this.connectedUsers.get(receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        this.sendToSocket(receiverWs, {
          type: 'message_received',
          data: {
            message: formattedMessage,
            conversationId: conversation.id
          }
        });
        console.log('📤 Message delivered to receiver via WebSocket');
      } else {
        console.log('📱 Receiver offline, message stored for later delivery');
      }

      console.log('✅ Message processing completed successfully');

    } catch (error) {
      console.error('❌ Error handling send message:', error);
      this.sendToSocket(ws, {
        type: 'error',
        data: {
          errorType: 'SEND_MESSAGE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send message',
          timestamp: Date.now()
        }
      });
    }
  }

  private handleJoinConversation(ws: AuthenticatedWebSocket, data: any) {
    const { conversationId } = data;
    console.log(`🏠 User ${ws.userId} joining conversation ${conversationId}`);
    
    this.sendToSocket(ws, {
      type: 'conversation_joined',
      data: { conversationId }
    });
  }

  private handleLeaveConversation(ws: AuthenticatedWebSocket, data: any) {
    const { conversationId } = data;
    console.log(`🚪 User ${ws.userId} leaving conversation ${conversationId}`);
    
    this.sendToSocket(ws, {
      type: 'conversation_left',
      data: { conversationId }
    });
  }

  private async handleMarkAsRead(ws: AuthenticatedWebSocket, data: any) {
    const { conversationId } = data;
    const userId = ws.userId!;

    try {
      // Mark messages as read in database
      const updatedMessages = await prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          receiverId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      console.log(`✅ Marked ${updatedMessages.count} messages as read in conversation ${conversationId}`);

      // Notify other participant
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (conversation) {
        const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
        const otherUserWs = this.connectedUsers.get(otherUserId);
        
        if (otherUserWs && otherUserWs.readyState === WebSocket.OPEN) {
          this.sendToSocket(otherUserWs, {
            type: 'messages_read',
            data: {
              conversationId: conversationId,
              readBy: userId,
              count: updatedMessages.count
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  private handleUserTyping(ws: AuthenticatedWebSocket, data: any) {
    const { conversationId, typing } = data;
    const userId = ws.userId!;

    // Find other user in conversation and notify them
    prisma.conversation.findUnique({
      where: { id: conversationId }
    }).then(conversation => {
      if (conversation) {
        const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
        const otherUserWs = this.connectedUsers.get(otherUserId);
        
        if (otherUserWs && otherUserWs.readyState === WebSocket.OPEN) {
          this.sendToSocket(otherUserWs, {
            type: 'user_typing',
            data: {
              userId: userId,
              conversationId: conversationId,
              typing: typing
            }
          });
        }
      }
    }).catch(error => {
      console.error('❌ Error handling typing indicator:', error);
    });
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    const message = {
      type: 'user_status_changed',
      data: {
        userId: userId,
        isOnline: isOnline,
        lastSeen: new Date().toISOString()
      }
    };

    this.connectedUsers.forEach((ws, connectedUserId) => {
      if (connectedUserId !== userId && ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, message);
      }
    });
  }

  private sendToSocket(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
      }
    } else {
      console.warn('⚠️ Cannot send message, WebSocket not open');
    }
  }

  // Public methods
  public isUserOnline(userId: string): boolean {
    const ws = this.connectedUsers.get(userId);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  public getOnlineUsers(): string[] {
    const onlineUsers: string[] = [];
    this.connectedUsers.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        onlineUsers.push(userId);
      }
    });
    return onlineUsers;
  }

  public sendToUser(userId: string, message: WebSocketMessage): boolean {
    const ws = this.connectedUsers.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendToSocket(ws, message);
      return true;
    }
    return false;
  }

  public getConnectedUserCount(): number {
    return Array.from(this.connectedUsers.values()).filter(
      ws => ws.readyState === WebSocket.OPEN
    ).length;
  }
}

export default new WebSocketService();