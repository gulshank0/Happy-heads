import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/client';

const prisma = new PrismaClient();

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const { name, email, age, bio, phone, avatar, gender, googleId,url,location,year,major,interests } = req.body;
      
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
        data: { name, email, avatar, age: Number(age), bio, phone, gender, googleId, url, location, year, major, interests, createdAt: new Date(), updatedAt: new Date() }
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
      const { name, email, avatar, age, phone, bio, gender, url, location, year, major, interests } = req.body;

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
      
      if (url !== undefined) updateData.url = url;
      if (location !== undefined) updateData.location = location;
      if (year !== undefined) updateData.year = year;
      if (major !== undefined) updateData.major = major;
      if (interests !== undefined) updateData.interests = interests;

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

  // Get all users (for initial load)
  async getAllUsers(req: Request, res: Response) {
    try {
      const currentUserId = (req.user as any)?.id;
      
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const users = await prisma.user.findMany({
        where: {
          id: { not: currentUserId }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          age: true,
          year: true,
          major: true,
          interests: true,
          createdAt: true,
          location: true,
          url: true
        },
        take: 20,
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(users);
    } catch (error) {
      console.error('❌ Get all users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
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
      interface SearchUserQuery {
        q?: string;
        limit?: string;
      }

      interface UserSearchWhereClause {
        id: { not: string };
        OR?: Array<{
          name?: {
            contains: string;
            mode: 'insensitive';
          };
          email?: {
            contains: string;
            mode: 'insensitive';
          };
        }>;
      }

      interface UserSelectFields {
        id: true;
        name: true;
        email: true;
        avatar: true;
        bio: true;
        age: true;
        createdAt: true;
        year?: true;
        major?: true;
        interests?: true;
        location?: true;
        url?: true;
      }

      interface UserWithConversationInfo {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        bio: string | null;
        age: number | null;
        createdAt: Date;
        year?: string | null;
        major?: string | null;
        interests?: string | null;
        location?: string | null;
        url?: string | null;
        hasExistingConversation: boolean;
      }

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
          year: true,
          major: true,
          interests: true,
          location: true,
          url: true,
          createdAt: true,
          updatedAt: true
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

      res.json(usersWithConversationInfo);
    } catch (error) {
      console.error('❌ Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }

  // Get user profile
  async getUserProfile(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Verify current user exists in database
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });

      if (!currentUser) {
        console.log('❌ Current user not found in database:', userId);
        return res.status(404).json({ error: 'Current user not found' });
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
          year: true,
          major: true,
          interests: true,
          location: true,
          url: true,
          googleId: true,
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

  // Test database connection for debugging
  async testDatabaseConnection(req: Request, res: Response) {
    try {
      const currentUserId = (req.user as any)?.id;
      
      if (!currentUserId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Test basic user count
      const userCount = await prisma.user.count();
      
      // Test current user exists
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, name: true, email: true }
      });

      if (!currentUser) {
        console.log('❌ Current user not found in database:', currentUserId);
        return res.status(404).json({ error: 'Current user not found' });
      }

      // Test sample users query
      const sampleUsers = await prisma.user.findMany({
        where: {
          id: { not: currentUserId }
        },
        select: {
          id: true,
          name: true,
          email: true
        },
        take: 5
      });

      res.json({
        success: true,
        debug: {
          totalUsers: userCount,
          currentUser: currentUser,
          sampleUsers: sampleUsers,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}