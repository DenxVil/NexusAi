import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { 
  createChat, 
  getUserChats, 
  getChat, 
  addMessage, 
  deleteChat 
} from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
const createChatValidation = [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat title must be between 1 and 100 characters'),
  body('systemPrompt')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('System prompt cannot exceed 1000 characters')
];

const addMessageValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message content must be between 1 and 10000 characters'),
  body('role')
    .optional()
    .isIn(['user', 'assistant', 'system'])
    .withMessage('Invalid message role')
];

const getChatValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID')
];

const getUserChatsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Routes
router.post('/', createChatValidation, createChat);
router.get('/', getUserChatsValidation, getUserChats);
router.get('/:chatId', getChatValidation, getChat);
router.post('/:chatId/messages', addMessageValidation, addMessage);
router.delete('/:chatId', getChatValidation, deleteChat);

export default router;