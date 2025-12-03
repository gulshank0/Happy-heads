import { Router } from 'express';
import { MatchingController } from '../controllers/matchingController';
import { authenticateUser } from '../middleware/auth';

const router = Router();
const matchingController = new MatchingController();

// All routes require authentication
router.use(authenticateUser);

// Get potential matches
router.get('/matches', matchingController.getMatches.bind(matchingController));

// Get users for discovery/swiping
router.get('/discover', matchingController.getDiscoveryUsers.bind(matchingController));

// Handle swipe action (like or pass)
router.post('/swipe', matchingController.handleSwipe.bind(matchingController));

// Like a user (legacy endpoint)
router.post('/like', matchingController.likeUser.bind(matchingController));

// Get user preferences
router.get('/preferences', matchingController.getPreferences.bind(matchingController));

// Update user preferences
router.put('/preferences', matchingController.updatePreferences.bind(matchingController));

// Update personality traits
router.put('/personality', matchingController.updatePersonality.bind(matchingController));

export default router;