import express, { Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/userController';
import { User } from '../../generated/client'; // Adjust the import path as necessary

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

export default router;