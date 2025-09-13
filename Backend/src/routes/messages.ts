import express from 'express';
import { MessageController } from '../controllers/messageController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const messageController = new MessageController();

// Get all conversations
router.get('/conversations', requireAuth, messageController.getConversations.bind(messageController));

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', requireAuth, messageController.getMessages.bind(messageController));

// Send a new message (general endpoint)
router.post('/send', requireAuth, messageController.sendMessage.bind(messageController));

// Send message to specific conversation
router.post('/conversations/:conversationId/messages', requireAuth, messageController.sendMessage.bind(messageController));

// Create a new conversation
router.post('/conversations', requireAuth, messageController.createConversation.bind(messageController));

// Mark messages as read
router.patch('/conversations/:conversationId/read', requireAuth, messageController.markAsRead.bind(messageController));

// Delete a conversation
router.delete('/conversations/:conversationId', requireAuth, messageController.deleteConversation.bind(messageController));

export default router;