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
      imageUrl = `http://localhost:${process.env.PORT || 8000}/uploads/posts/${req.file.filename}`;
    }

    const post = await prisma.post.create({
      data: {
        title: title || '',
        content: content || '',
        authorId: userId,
        published: true,
        image: imageUrl
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
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
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
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent posts
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      userId: post.author.id,
      userName: post.author.name || 'Anonymous',
      userAvatar: post.author.avatar || '/default-avatar.png',
      userAge: post.author.age || 20,
      userCollege: post.author.college || 'Unknown College',
      userLocation: post.author.location ? JSON.parse(post.author.location as string).city || 'Unknown' : 'Unknown',
      content: post.content || '',
      image: post.image,
      title: post.title,
      timestamp: formatTimestamp(post.createdAt),
      likes: 0, // You can implement likes system later
      comments: 0, // You can implement comments system later
      isLiked: false,
      isBookmarked: false,
      tags: [], // You can add tags field to Post model if needed
      privacy: 'public' as const
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
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
        interests: true,
        location: true
      },
      take: 20
    });

    const formattedProfiles = profiles.map(profile => ({
      id: profile.id,
      name: profile.name || 'Anonymous',
      age: profile.age || 20,
      location: profile.location ? JSON.parse(profile.location as string).city || 'Unknown' : 'Unknown',
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