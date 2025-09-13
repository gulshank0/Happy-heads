import { MessageController } from '../controllers/messageController';

// Make sure to track user connections properly
const userConnections = new Map<string, WebSocket>();

export const handleWebSocketConnection = (ws: WebSocket, request: any) => {
  // Extract user ID from connection (you might get this from query params or auth)
  const userId = request.url?.split('userId=')[1]?.split('&')[0];
  
  if (userId) {
    userConnections.set(userId, ws);
    console.log('✅ User connected:', userId);
    
    // Set user as online
    updateUserStatus(userId, true);
  }

  ws.onclose = () => {
    if (userId) {
      userConnections.delete(userId);
      console.log('❌ User disconnected:', userId);
      
      // Set user as offline
      updateUserStatus(userId, false);
    }
  };
};

// Make sure this handles send-message properly
export const handleWebSocketMessage = async (ws: WebSocket, message: any, clients: Map<string, WebSocket>) => {
  try {
    console.log('📨 WebSocket message received:', {
      type: message.type,
      conversationId: message.conversationId,
      timestamp: new Date().toISOString()
    });

    switch (message.type) {
      case 'send-message':
        await handleSendMessage(ws, message, clients);
        break;
      
      case 'join-conversation':
        await handleJoinConversation(ws, message);
        break;
        
      case 'mark-as-read':
        await handleMarkAsRead(ws, message, clients);
        break;
        
      case 'ping':
        // Respond to ping with pong
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: message.timestamp,
          id: `pong_${Date.now()}`
        }));
        break;
        
      default:
        console.log('🤷 Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('❌ WebSocket handler error:', error);
    
    const errorResponse = {
      type: 'error',
      data: {
        errorType: 'message_processing',
        message: error instanceof Error ? error.message : 'Unknown error',
        originalMessage: message
      },
      id: message.id || `error_${Date.now()}`,
      timestamp: Date.now()
    };
    
    ws.send(JSON.stringify(errorResponse));
  }
};

async function handleSendMessage(ws: WebSocket, message: any, clients: Map<string, WebSocket>) {
  try {
    console.log('📤 Processing send-message:', message);
    
    // Call your message controller method
    const messageController = new MessageController();
    
    // Create a mock request/response for the controller
    const mockReq = {
      user: { id: message.senderId }, // You'll need to get this from the WebSocket connection
      body: {
        conversationId: message.conversationId,
        receiverId: message.receiverId,
        content: message.content,
        messageType: message.messageType || 'TEXT'
      }
    } as any;

    const mockRes = {
      json: (data: any) => {
        // Send success response back to sender
        ws.send(JSON.stringify({
          type: 'message-sent',
          data: data,
          id: message.id,
          timestamp: Date.now()
        }));
        
        // Send new message to receiver if they're online
        const receiverWs = clients.get(message.receiverId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(JSON.stringify({
            type: 'new-message',
            message: data,
            conversationId: message.conversationId,
            timestamp: Date.now()
          }));
        }
      },
      status: (code: number) => ({
        json: (data: any) => {
          ws.send(JSON.stringify({
            type: 'error',
            data: { ...data, statusCode: code },
            id: message.id,
            timestamp: Date.now()
          }));
        }
      })
    } as any;

    await messageController.sendMessage(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Send message error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      data: {
        errorType: 'message_send',
        message: error instanceof Error ? error.message : 'Failed to send message'
      },
      id: message.id,
      timestamp: Date.now()
    }));
  }
}
async function updateUserStatus(userId: string, isOnline: boolean) {
    try {
        // You would typically update this in your database
        // This is a placeholder implementation - replace with your actual database logic
        
        console.log(`📡 Updating user ${userId} status to ${isOnline ? 'online' : 'offline'}`);
        
        // Example with a hypothetical User model/service
        // await User.updateOne({ _id: userId }, { isOnline, lastSeen: new Date() });
        
        // Or if you have a user service:
        // const userService = new UserService();
        // await userService.updateStatus(userId, isOnline);
        
        // For now, just log the status change
        // Replace this with your actual database update logic
        
    } catch (error) {
        console.error('❌ Failed to update user status:', error);
    }
}
async function handleJoinConversation(ws: WebSocket, message: any) {
    try {
        console.log('🔗 User joining conversation:', {
            conversationId: message.conversationId,
            userId: message.userId,
            timestamp: new Date().toISOString()
        });

        // You could add conversation validation here if needed
        // For example, check if user has permission to join this conversation
        
        // Send confirmation back to the user
        ws.send(JSON.stringify({
            type: 'conversation-joined',
            data: {
                conversationId: message.conversationId,
                status: 'success',
                message: 'Successfully joined conversation'
            },
            id: message.id || `join_${Date.now()}`,
            timestamp: Date.now()
        }));

        // Optionally, you could fetch recent messages for this conversation
        // and send them to the user who just joined
        // const messageController = new MessageController();
        // const recentMessages = await messageController.getConversationMessages(message.conversationId);
        
    } catch (error) {
        console.error('❌ Join conversation error:', error);
        
        ws.send(JSON.stringify({
            type: 'error',
            data: {
                errorType: 'join_conversation',
                message: error instanceof Error ? error.message : 'Failed to join conversation',
                conversationId: message.conversationId
            },
            id: message.id || `join_error_${Date.now()}`,
            timestamp: Date.now()
        }));
    }
}
async function handleMarkAsRead(ws: WebSocket, message: any, clients: Map<string, WebSocket>) {
    try {
        console.log('👁️ Processing mark-as-read:', {
            conversationId: message.conversationId,
            userId: message.userId,
            messageId: message.messageId,
            timestamp: new Date().toISOString()
        });

        // Create a mock request/response for the message controller
        const messageController = new MessageController();
        
        const mockReq = {
            user: { id: message.userId },
            body: {
                conversationId: message.conversationId,
                messageId: message.messageId // Optional: specific message to mark as read
            }
        } as any;

        const mockRes = {
            json: (data: any) => {
                // Send confirmation back to the user who marked as read
                ws.send(JSON.stringify({
                    type: 'marked-as-read',
                    data: {
                        conversationId: message.conversationId,
                        status: 'success',
                        ...data
                    },
                    id: message.id || `read_${Date.now()}`,
                    timestamp: Date.now()
                }));

                // Notify other participants in the conversation about read status
                // This could be used to show "read" indicators
                const otherParticipants = message.participants || [];
                otherParticipants.forEach((participantId: string) => {
                    if (participantId !== message.userId) {
                        const participantWs = clients.get(participantId);
                        if (participantWs && participantWs.readyState === WebSocket.OPEN) {
                            participantWs.send(JSON.stringify({
                                type: 'message-read-by',
                                data: {
                                    conversationId: message.conversationId,
                                    readByUserId: message.userId,
                                    messageId: message.messageId
                                },
                                timestamp: Date.now()
                            }));
                        }
                    }
                });
            },
            status: (code: number) => ({
                json: (data: any) => {
                    ws.send(JSON.stringify({
                        type: 'error',
                        data: { ...data, statusCode: code },
                        id: message.id || `read_error_${Date.now()}`,
                        timestamp: Date.now()
                    }));
                }
            })
        } as any;

        // Call the message controller method to mark messages as read
        // You'll need to ensure your MessageController has a markAsRead method
        if (typeof messageController.markAsRead === 'function') {
            await messageController.markAsRead(mockReq, mockRes);
        } else {
            // Fallback if the method doesn't exist yet
            mockRes.json({
                message: 'Messages marked as read',
                conversationId: message.conversationId
            });
        }

    } catch (error) {
        console.error('❌ Mark as read error:', error);
        
        ws.send(JSON.stringify({
            type: 'error',
            data: {
                errorType: 'mark_as_read',
                message: error instanceof Error ? error.message : 'Failed to mark messages as read',
                conversationId: message.conversationId
            },
            id: message.id || `read_error_${Date.now()}`,
            timestamp: Date.now()
        }));
    }
}

