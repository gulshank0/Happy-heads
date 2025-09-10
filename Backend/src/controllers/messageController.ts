import { Request, Response } from 'express';
import prisma from '../config/database';

export class MessageController {
  // Get all conversations for a user
  async getConversations(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  receiverId: userId,
                  isRead: false
                }
              }
            }
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        }
      });

      // Format conversations for frontend
      const formattedConversations = conversations.map(conv => {
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
        const lastMessage = conv.messages[0];
        
        return {
          id: conv.id,
          user: {
            id: otherUser.id,
            name: otherUser.name || 'Unknown User',
            avatar: otherUser.avatar || '/default-avatar.png',
            lastSeen: 'Online',
            isOnline: true
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            content: lastMessage.content,
            timestamp: this.formatTimestamp(lastMessage.createdAt),
            isRead: lastMessage.isRead
          } : null,
          unreadCount: conv._count.messages,
          updatedAt: conv.updatedAt
        };
      });

      res.json(formattedConversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }

  // Get messages for a specific conversation
  async getMessages(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Verify user is part of this conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const messages = await prisma.message.findMany({
        where: {
          conversationId: conversationId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          receiverId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      const formattedMessages = messages.reverse().map(message => ({
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        messageType: message.messageType,
        timestamp: this.formatTimestamp(message.createdAt),
        isRead: message.isRead,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          avatar: message.sender.avatar
        }
      }));

      res.json(formattedMessages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }

  // Send a new message
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { receiverId, content, messageType = 'TEXT' } = req.body;

      console.log('🔍 Send Message Debug:', {
        userId,
        receiverId,
        content,
        messageType,
        user: req.user,
        session: (req.session as any)?.passport?.user
      });

      if (!userId) {
        console.log('❌ No user ID found');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!receiverId || !content) {
        console.log('❌ Missing receiverId or content:', { receiverId, content });
        return res.status(400).json({ error: 'Receiver ID and content are required' });
      }

      if (userId === receiverId) {
        console.log('❌ User trying to message themselves');
        return res.status(400).json({ error: 'Cannot send message to yourself' });
      }

      // Check if receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId }
      });

      if (!receiver) {
        console.log('❌ Receiver not found:', receiverId);
        return res.status(404).json({ error: 'Receiver not found' });
      }

      console.log('✅ Receiver found:', receiver.name);

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: receiverId },
            { user1Id: receiverId, user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        console.log('📝 Creating new conversation');
        conversation = await prisma.conversation.create({
          data: {
            user1Id: userId,
            user2Id: receiverId,
            lastMessageAt: new Date()
          }
        });
        console.log('✅ Conversation created:', conversation.id);
      } else {
        console.log('✅ Existing conversation found:', conversation.id);
      }

      // Create the message
      console.log('📨 Creating message...');
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          receiverId: receiverId,
          content: content,
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

      console.log('✅ Message created:', message.id);

      // Update conversation's last message time
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });

      console.log('✅ Conversation updated');

      const formattedMessage = {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        messageType: message.messageType,
        timestamp: this.formatTimestamp(message.createdAt),
        isRead: message.isRead,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          avatar: message.sender.avatar
        }
      };

      console.log('✅ Message sent successfully:', formattedMessage);
      res.status(201).json(formattedMessage);
    } catch (error) {
      console.error('❌ Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Create a new conversation
  async createConversation(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { otherUserId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!otherUserId) {
        return res.status(400).json({ error: 'Other user ID is required' });
      }

      if (userId === otherUserId) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      // Check if other user exists
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId }
      });

      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if conversation already exists
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: otherUserId },
            { user1Id: otherUserId, user2Id: userId }
          ]
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            user1Id: userId,
            user2Id: otherUserId
          },
          include: {
            user1: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        });
      }

      const otherUserData = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

      const formattedConversation = {
        id: conversation.id,
        user: {
          id: otherUserData.id,
          name: otherUserData.name || 'Unknown User',
          avatar: otherUserData.avatar || '/default-avatar.png',
          lastSeen: 'Online',
          isOnline: true
        },
        lastMessage: null,
        unreadCount: 0,
        messages: []
      };

      res.status(201).json(formattedConversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  }

  // Mark messages as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { conversationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Verify user is part of this conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      await prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          receiverId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      res.json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  }

  // Delete a conversation
  async deleteConversation(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { conversationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Verify user is part of this conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Delete all messages first, then the conversation
      await prisma.message.deleteMany({
        where: { conversationId: conversationId }
      });

      await prisma.conversation.delete({
        where: { id: conversationId }
      });

      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }

  // Add this method to debug authentication
  async debugAuth(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const sessionUser = (req.session as any)?.passport?.user;
      
      console.log('🔍 Debug Auth Info:', {
        userId,
        sessionUser,
        reqUser: req.user,
        session: req.session,
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated?.(),
      });

      res.json({
        userId,
        sessionUser,
        authenticated: !!userId,
        sessionID: req.sessionID
      });
    } catch (error) {
      console.error('Auth debug error:', error);
      res.status(500).json({ error: 'Auth debug failed' });
    }
  }

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else if (diffInMinutes < 2880) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  }
}