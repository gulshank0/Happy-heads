import express from 'express';
import { PrismaClient } from '../../generated/client';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

// Extend Express Request type to include user with id
declare global {
  namespace Express {
    interface User {
      id: string;
      [key: string]: any;
    }
  }
}

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for post images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadPostImage = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Create a new post
router.post('/create', requireAuth, uploadPostImage.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `http://localhost:8000/uploads/posts/${req.file.filename}`;
    }

    const post = await prisma.post.create({
      data: {
        title: title || '',
        content: content || '',
        authorId: userId,
        published: true,
        image: imageUrl ? imageUrl : null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            age: true,
            college: true,
            location: true
          }
        }
      }
    });

    res.json({ success: true, post });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts for feed
router.get('/feed', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: { select: { id: true, name: true, avatar: true, age: true, college: true, location: true } },
      likes: { select: { userId: true } },
      _count: { select: { comments: true, likes: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const formattedPosts = posts.map(post => ({
    ...post,
    comments: post._count.comments,
    likes: post._count.likes,
    isLiked: post.likes.some(like => like.userId === userId),
  }));

  res.json(formattedPosts);
});

// Get comments for a post
router.get('/:postId/comments', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a comment on a post
router.post('/:postId/comments', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId || !content?.trim()) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const newComment = await prisma.comment.create({
      data: { content, authorId: userId, postId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, college: true, major: true, year: true },
        },
      },
    });

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Get user profiles for matching
router.get('/profiles', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    
    const profiles = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } }, // Exclude current user
          { name: { not: null } }, // Only users with names
          { age: { not: null } } // Only users with age
        ]
      },
      select: {
        id: true,
        name: true,
        age: true,
        avatar: true,
        bio: true,
        college: true,
        major: true,
        year: true,
        location: true,
        interests: true
      },
      take: 20
    });

    const formattedProfiles = profiles.map(profile => ({
      id: profile.id,
      name: profile.name || 'Anonymous',
      age: profile.age || 20,
      location: profile.location || 'Unknown',
      college: profile.college || 'Unknown College',
      major: profile.major || 'Unknown Major',
      year: profile.year || 1,
      bio: profile.bio || 'No bio available',
      interests: profile.interests || [],
      photos: [profile.avatar || '/default-avatar.png'],
      isVerified: false,
      isOnline: Math.random() > 0.5, // Random online status for now
      lastSeen: 'Recently active',
      distance: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)} km away`,
      mutualFriends: Math.floor(Math.random() * 5),
      compatibility: Math.floor(Math.random() * 30) + 70
    }));

    res.json(formattedProfiles);
  } catch (error) {
    console.error('Profiles fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

router.post('/:postId/like', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { postId } = req.params;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const existing = await prisma.like.findFirst({ where: { userId, postId } });
  if (existing) return res.status(400).json({ error: 'Already liked' });

  await prisma.like.create({ data: { userId, postId } });
  res.json({ success: true });
});

router.post('/:postId/unlike', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { postId } = req.params;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  await prisma.like.deleteMany({ where: { userId, postId } });
  res.json({ success: true });
});

async function recordLike(userId: string, postId: string): Promise<boolean> {
  // Check if like already exists
  const existingLike = await prisma.like.findFirst({
    where: {
      userId,
      postId
    }
  });

  if (existingLike) return false;

  // Create the like
  await prisma.like.create({
    data: { userId, postId }
  });

  return true;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

export default router;