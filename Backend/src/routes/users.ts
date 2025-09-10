import express, { Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/userController';
import { User } from '../../generated/client'; // Adjust the import path as necessary
import multer from 'multer';
import path from 'path';

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
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check if user exists in session or request
  if (req.user || (req.session as any)?.passport?.user) {
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
router.get('/profile', requireAuth, (req, res) => {
  res.json(req.user);
});

router.put('/profile', requireAuth, userController.updateUser.bind(userController));
router.delete('/profile', requireAuth, userController.deleteUser.bind(userController));

// File upload route
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'File uploaded successfully', file: req.file });
});

export default router;