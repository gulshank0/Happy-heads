import express from 'express';
import { UserController } from '../controllers/userController';

const router = express.Router();
const userController = new UserController();

// Public routes
router.post('/data', userController.createUser.bind(userController));
router.get('/:id', userController.getUser.bind(userController));

// Protected routes (will add auth middleware later)
router.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.put('/profile', userController.updateUser.bind(userController));
router.delete('/profile', userController.deleteUser.bind(userController));

export default router;