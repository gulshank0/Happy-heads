import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateUser } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(authenticateUser);

// Get all notifications
router.get('/', notificationController.getNotifications.bind(notificationController));

// Mark notifications as read
router.post('/mark-read', notificationController.markAsRead.bind(notificationController));

// Get notification stats
router.get('/stats', notificationController.getStats.bind(notificationController));

export default router;