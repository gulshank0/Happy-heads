import { Request, Response } from 'express';
import prisma from '../config/database';

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const { name, email, age, bio, phone, avatar, gender, googleId } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json(
          { message: 'User already exists' }
        );
      }

      const user = await prisma.user.create({
        data: { name, email, avatar, age: Number(age), bio, phone, gender, googleId, createdAt: new Date(), updatedAt: new Date() }
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { id: id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { name, email, avatar, age, phone, bio, gender } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date()
      };

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (age !== undefined) updateData.age = age;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;
      if (gender !== undefined) updateData.gender = gender;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2002') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to logout after deletion' });
        }
        res.json({ message: 'Account deleted successfully' });
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  // Get all users (for search/messaging)
  async getAllUsers(req: Request, res: Response) {
    try {
      const currentUserId = (req.user as any)?.id;
      const search = req.query.search as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const whereClause: any = {
        id: {
          not: currentUserId // Exclude current user
        }
      };

      // Add search filter if provided
      if (search && search.trim()) {
        whereClause.OR = [
          {
            name: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        ];
      }

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
        take: limit,
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        users: users,
        count: users.length
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch users' 
      });
    }
  }

  // Search users specifically for messaging
  async searchUsersForMessaging(req: Request, res: Response) {
    try {
      const currentUserId = (req.user as any)?.id;
      const { q: searchQuery } = req.query;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!searchQuery || typeof searchQuery !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Get existing conversation partners to show them differently
      const existingConversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { user1Id: currentUserId },
            { user2Id: currentUserId }
          ]
        },
        select: {
          user1Id: true,
          user2Id: true
        }
      });

      const existingPartnerIds = existingConversations.map(conv => 
        conv.user1Id === currentUserId ? conv.user2Id : conv.user1Id
      );

      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              id: {
                not: currentUserId // Exclude current user
              }
            },
            {
              OR: [
                {
                  name: {
                    contains: searchQuery,
                    mode: 'insensitive'
                  }
                },
                {
                  email: {
                    contains: searchQuery,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          age: true
        },
        take: 10,
        orderBy: [
          {
            name: 'asc'
          }
        ]
      });

      // Add hasExistingConversation flag
      const usersWithConversationFlag = users.map(user => ({
        ...user,
        hasExistingConversation: existingPartnerIds.includes(user.id)
      }));

      res.json({
        success: true,
        users: usersWithConversationFlag,
        query: searchQuery
      });
    } catch (error) {
      console.error('Search users for messaging error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to search users' 
      });
    }
  }

  // Get user profile
  async getUserProfile(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          age: true,
          phone: true,
          gender: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: user
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get user profile' 
      });
    }
  }
}