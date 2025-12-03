import express, { Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/userController';
import { User } from '../../generated/client'; // Adjust the import path as necessary
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '../../generated/client';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();

// Extend Request interface to include passport methods
declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user?: User | undefined;
    }
  }
}

const router = express.Router();
const userController = new UserController();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Add authentication middleware
const requireAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if user exists in session or request
  if (req.user || (req.session as any)?.passport?.user) {
    // Ensure req.user is set properly
    if (!req.user && (req.session as any)?.passport?.user) {
      req.user = { id: (req.session as any).passport.user };
    }
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Public routes
router.post('/data', userController.createUser.bind(userController));
router.get('/:id', userController.getUser.bind(userController));

// Add this route for user verification (used by Profile page)
router.get('/verify', (req: Request, res: Response) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.status(401).json({ authenticated: false, error: 'Not authenticated' });
  }
});

// Protected routes
router.get('/profile', requireAuthMiddleware, userController.getUserProfile.bind(userController));
router.put('/profile', requireAuthMiddleware, userController.updateUser.bind(userController));
router.delete('/profile', requireAuthMiddleware, userController.deleteUser.bind(userController));

// Get all users (with optional search)
router.get('/', requireAuth, userController.getAllUsers.bind(userController));

// Search users for messaging - single route definition
router.get('/search-messaging', requireAuth, userController.searchUsersForMessaging.bind(userController));

// Test database connection (for debugging)
router.get('/test-db', requireAuthMiddleware, userController.testDatabaseConnection.bind(userController));

// File upload route
router.post('/upload', requireAuthMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'File uploaded successfully', file: req.file });
});

// Add this debug route temporarily
router.get('/debug-search', async (req: Request, res: Response) => {
  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      take: 10
    });
    
    res.json({
      message: 'Debug info',
      user: req.user,
      session: (req.session as any)?.passport,
      allUsers: allUsers,
      isAuthenticated: req.isAuthenticated?.()
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;