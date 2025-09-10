import { Request, Response } from 'express';
import { MatchingService } from '../services/matchingService';
import { PrismaClient } from '../../generated/client';

const prisma = new PrismaClient();
const matchingService = new MatchingService();

export class MatchingController {
  // Get potential matches
  async getMatches(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const matches = await matchingService.findMatches(userId, limit);

      res.json({
        success: true,
        matches,
        count: matches.length
      });
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get matches'
      });
    }
  }

  // Like a user
  async likeUser(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { targetUserId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      const isMatch = await matchingService.recordLike(userId, targetUserId);

      res.json({
        success: true,
        isMatch,
        message: isMatch ? "It's a match! 🎉" : "Like recorded"
      });
    } catch (error) {
      console.error('Like user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to like user'
      });
    }
  }

  // Update user preferences
  async updatePreferences(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const preferences = req.body;
      
      await prisma.userPreferences.upsert({
        where: { userId },
        update: preferences,
        create: { userId, ...preferences }
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  }

  // Get user preferences
  async getPreferences(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const preferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });

      res.json({
        success: true,
        preferences
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get preferences'
      });
    }
  }

  // Update personality traits
  async updatePersonality(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const personality = req.body;
      
      await prisma.personalityTraits.upsert({
        where: { userId },
        update: personality,
        create: { userId, ...personality }
      });

      res.json({
        success: true,
        message: 'Personality traits updated successfully'
      });
    } catch (error) {
      console.error('Update personality error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update personality traits'
      });
    }
  }
}