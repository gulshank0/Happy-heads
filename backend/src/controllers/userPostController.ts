import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export class UserPostController {
  // Create a new user post
  async createUserPost(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title, content, postType } = req.body;
      
      if (!title && !content) {
        return res.status(400).json({ error: 'Either title or content is required' });
      }

      // Handle image upload if present
      let imageUrl = null;
      if (req.file) {
        // Store relative path for the image
        imageUrl = `/uploads/${req.file.filename}`;
      }

      // Create UserPost without linking to Post table
      const userPost = await prisma.userPost.create({
        data: {
          title: title || '',
          content: content || null,
          postType: postType || 'image',
          image: imageUrl,
          userId: userId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        userPost,
        message: 'User post created successfully'
      });

    } catch (error) {
      console.error('Create user post error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user post'
      });
    }
  }

  // Get user posts for a specific user
  async getUserPosts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;

      const userPosts = await prisma.userPost.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      });

      const totalCount = await prisma.userPost.count({
        where: { userId }
      });

      res.json({
        success: true,
        userPosts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user posts'
      });
    }
  }

  // Get current user's posts
  async getMyUserPosts(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;

      const userPosts = await prisma.userPost.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      });

      const totalCount = await prisma.userPost.count({
        where: { userId }
      });

      res.json({
        success: true,
        userPosts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Get my user posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch your posts'
      });
    }
  }

  // Update a user post
  async updateUserPost(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { postId } = req.params;
      const { title, content, postType } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user owns this post
      const existingPost = await prisma.userPost.findUnique({
        where: { id: postId }
      });

      if (!existingPost || existingPost.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this post' });
      }

      const updatedPost = await prisma.userPost.update({
        where: { id: postId },
        data: {
          title: title || existingPost.title,
          content: content !== undefined ? content : existingPost.content,
          postType: postType || existingPost.postType
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      res.json({
        success: true,
        userPost: updatedPost,
        message: 'Post updated successfully'
      });

    } catch (error) {
      console.error('Update user post error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update post'
      });
    }
  }

  // Delete a user post
  async deleteUserPost(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { postId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user owns this post
      const existingPost = await prisma.userPost.findUnique({
        where: { id: postId }
      });

      if (!existingPost || existingPost.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }

      // Delete the user post only (no linked post to delete)
      await prisma.userPost.delete({
        where: { id: postId }
      });

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });

    } catch (error) {
      console.error('Delete user post error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete post'
      });
    }
  }

  // Get all user posts (for feed)
  async getAllUserPosts(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;

      const userPosts = await prisma.userPost.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      });

      const totalCount = await prisma.userPost.count();

      res.json({
        success: true,
        userPosts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('Get all user posts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user posts'
      });
    }
  }
}