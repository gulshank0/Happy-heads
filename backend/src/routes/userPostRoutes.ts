import { Router } from 'express';
import { UserPostController } from '../controllers/userPostController';
import { authenticateUser } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import  prisma  from '../config/database';

const router = Router();
const userPostController = new UserPostController();

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `userpost-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticateUser);

// Create a new user post
router.post('/create', upload.single('image'), userPostController.createUserPost.bind(userPostController));

// Get current user's posts
router.get('/my-posts', userPostController.getMyUserPosts.bind(userPostController));

// Get user posts by user ID
router.get('/user/:userId', userPostController.getUserPosts.bind(userPostController));

// Get all user posts (for feed)
router.get('/feed', userPostController.getAllUserPosts.bind(userPostController));

// Get a specific user post by ID
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const userPost = await prisma.userPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!userPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ success: true, userPost });
  } catch (error) {
    console.error('Get user post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Update a user post (with optional image upload)
router.put('/:postId', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.params;
    const { title, content, postType, removeImage } = req.body;

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

    // Handle image update
    let imageUrl = existingPost.image;
    
    // If a new image is uploaded
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      
      // Remove old image file if it exists
      if (existingPost.image) {
        try {
          const oldImagePath = path.join(__dirname, '../../uploads', path.basename(existingPost.image));
          await require('fs').promises.unlink(oldImagePath);
        } catch (err) {
          console.log('Could not delete old image:', err);
        }
      }
    }
    // If removeImage flag is set
    else if (removeImage === 'true') {
      if (existingPost.image) {
        try {
          const oldImagePath = path.join(__dirname, '../../uploads', path.basename(existingPost.image));
          await require('fs').promises.unlink(oldImagePath);
        } catch (err) {
          console.log('Could not delete old image:', err);
        }
      }
      imageUrl = null;
    }

    // Update only the UserPost (no linked post)
    const updatedUserPost = await prisma.userPost.update({
      where: { id: postId },
      data: {
        title: title || existingPost.title,
        content: content !== undefined ? content : existingPost.content,
        postType: postType || existingPost.postType,
        image: imageUrl
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      userPost: updatedUserPost,
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Update user post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a user post
router.delete('/:postId', async (req, res) => {
  try {
    const userId = req.user?.id;
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

    // Delete image file if it exists
    if (existingPost.image) {
      try {
        const imagePath = path.join(__dirname, '../../uploads', path.basename(existingPost.image));
        await require('fs').promises.unlink(imagePath);
      } catch (err) {
        console.log('Could not delete image file:', err);
      }
    }

    // Delete only the UserPost (no linked post to delete)
    await prisma.userPost.delete({ where: { id: postId } });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete user post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// UserPosts don't have likes/comments - remove these routes
// If you want likes/comments on UserPosts, you'll need separate tables for them

export default router;