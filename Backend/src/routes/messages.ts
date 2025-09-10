import express from 'express';
import { MessageController } from '../controllers/messageController';

const router = express.Router();
const messageController = new MessageController();

// Enhanced authentication middleware with better debugging
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    // Handle OPTIONS requests without authentication
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    console.log('🔍 Auth Debug:', {
      method: req.method,
      path: req.path,
      user: req.user,
      session: req.session?.passport?.user,
      sessionID: req.sessionID,
      origin: req.headers.origin
    });

    // Check if user is authenticated via Passport
    if (req.user) {
      console.log('✅ User authenticated via req.user:', req.user.id);
      return next();
    }

    // Check if user is in session
    if (req.session?.passport?.user) {
      console.log('✅ User authenticated via session:', req.session.passport.user);
      // Attach user to request
      req.user = { id: req.session.passport.user };
      return next();
    }

    // If no authentication found
    console.log('❌ No authentication found');
    res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Remove the problematic OPTIONS handler and let the main CORS middleware handle it

// Get all conversations for the authenticated user
router.get('/conversations', requireAuth, messageController.getConversations.bind(messageController));

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', requireAuth, messageController.getMessages.bind(messageController));

// Send a new message
router.post('/send', requireAuth, messageController.sendMessage.bind(messageController));

// Create a new conversation
router.post('/conversations', requireAuth, messageController.createConversation.bind(messageController));

// Mark messages as read
router.patch('/conversations/:conversationId/read', requireAuth, messageController.markAsRead.bind(messageController));

// Delete a conversation
router.delete('/conversations/:conversationId', requireAuth, messageController.deleteConversation.bind(messageController));

// Debug route (remove in production)
router.get('/debug/auth', messageController.debugAuth?.bind(messageController));

export default router;