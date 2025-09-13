import { Router } from 'express';
import { body } from 'express-validator';
import { 
  sendChatMessage, 
  getAvailableModels, 
  generateContent 
} from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
const chatMessageValidation = [
  body('message')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message must be between 1 and 10000 characters'),
  body('model')
    .optional()
    .isIn(['gpt-4', 'gpt-3.5-turbo', 'claude-2'])
    .withMessage('Invalid model selection'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 8000 })
    .withMessage('Max tokens must be between 1 and 8000')
];

const generateContentValidation = [
  body('prompt')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Prompt must be between 1 and 5000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'code', 'summary', 'creative'])
    .withMessage('Invalid content type'),
  body('model')
    .optional()
    .isIn(['gpt-4', 'gpt-3.5-turbo', 'claude-2'])
    .withMessage('Invalid model selection')
];

// Routes
router.post('/chat', chatMessageValidation, sendChatMessage);
router.get('/models', getAvailableModels);
router.post('/generate', generateContentValidation, generateContent);

export default router;