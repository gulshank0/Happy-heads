import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/client';

const prisma = new PrismaClient();

export class NotificationController {
  // Get all notifications for a user
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get like notifications with read tracking
      const likeNotifications = await prisma.userLike.findMany({
        where: { receiverId: userId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              age: true,
              college: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Get match notifications with read tracking
      const matchNotifications = await prisma.match.findMany({
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
              age: true,
              college: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              avatar: true,
              age: true,
              college: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Get recent message notifications (only unread messages)
      const messageNotifications = await prisma.message.findMany({
        where: {
          receiverId: userId,
          isRead: false
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          conversation: {
            select: {
              id: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      });

      // Get notification read tracking
      const readNotifications = await prisma.notificationRead.findMany({
        where: { userId },
        select: {
          notificationId: true,
          notificationType: true
        }
      });

      const readNotificationSet = new Set(
        readNotifications.map(rn => `${rn.notificationType}_${rn.notificationId}`)
      );

      // Format notifications with proper read status
      const formattedNotifications = [
        ...likeNotifications.map(like => ({
          id: like.id,
          type: 'like',
          title: 'New Like! 💕',
          message: `${like.sender.name} liked you!`,
          user: like.sender,
          timestamp: like.createdAt,
          isRead: readNotificationSet.has(`like_${like.id}`)
        })),
        ...matchNotifications.map(match => {
          const otherUser = match.user1Id === userId ? match.user2 : match.user1;
          return {
            id: match.id,
            type: 'match',
            title: "It's a Match! 🎉",
            message: `You and ${otherUser.name} liked each other!`,
            user: otherUser,
            timestamp: match.createdAt,
            isRead: readNotificationSet.has(`match_${match.id}`)
          };
        }),
        ...messageNotifications.map(message => ({
          id: message.id,
          type: 'message',
          title: 'New Message 💬',
          message: `${message.sender.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
          user: message.sender,
          timestamp: message.createdAt,
          conversationId: message.conversation.id,
          isRead: message.isRead
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({
        success: true,
        notifications: formattedNotifications,
        unreadCount: formattedNotifications.filter(n => !n.isRead).length
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notifications'
      });
    }
  }

  // Mark notifications as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { notificationIds, type } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({ error: 'Invalid notification IDs' });
      }

      // Handle different notification types
      if (type === 'message') {
        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            id: { in: notificationIds },
            receiverId: userId
          },
          data: { isRead: true }
        });
      } else if (type === 'like' || type === 'match') {
        // For likes and matches, use the notification read tracking table
        const readRecords = notificationIds.map(id => ({
          userId,
          notificationId: id,
          notificationType: type,
          readAt: new Date()
        }));

        await prisma.notificationRead.createMany({
          data: readRecords,
          skipDuplicates: true
        });
      }

      res.json({
        success: true,
        message: 'Notifications marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notifications as read'
      });
    }
  }

  // Get notification stats
  async getStats(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get read notifications for this user
      const readNotifications = await prisma.notificationRead.findMany({
        where: { userId },
        select: {
          notificationId: true,
          notificationType: true
        }
      });

      const readNotificationSet = new Set(
        readNotifications.map(rn => `${rn.notificationType}_${rn.notificationId}`)
      );

      const [allLikes, allMatches, unreadMessages] = await Promise.all([
        // Get all likes received
        prisma.userLike.findMany({
          where: { receiverId: userId },
          select: { id: true }
        }),
        // Get all matches
        prisma.match.findMany({
          where: {
            OR: [
              { user1Id: userId },
              { user2Id: userId }
            ]
          },
          select: { id: true }
        }),
        // Get unread messages
        prisma.message.count({
          where: {
            receiverId: userId,
            isRead: false
          }
        })
      ]);

      // Count unread likes and matches
      const unreadLikes = allLikes.filter(like => !readNotificationSet.has(`like_${like.id}`)).length;
      const unreadMatches = allMatches.filter(match => !readNotificationSet.has(`match_${match.id}`)).length;

      res.json({
        success: true,
        stats: {
          likesReceived: unreadLikes,
          matches: unreadMatches,
          unreadMessages,
          totalNotifications: unreadLikes + unreadMatches + unreadMessages
        }
      });
    } catch (error) {
      console.error('Get notification stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification stats'
      });
    }
  }
}