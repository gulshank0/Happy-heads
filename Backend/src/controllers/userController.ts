import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma'; // Adjust the import path as necessary

const prisma = new PrismaClient();

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const { name, email, avatar } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser) {
        return res.status(400).json(
          { message: 'User already exists' }
        )
      }

      const user = await prisma.user.create({
        data: { name, email, avatar, createdAt: new Date(), updatedAt: new Date() }
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
        where: { id: Number(id) },
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
      const { name, avatar } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(avatar && { avatar })
        }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
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
}