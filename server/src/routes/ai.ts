import { Router } from 'express';
import { body } from 'express-validator';
import { 
  sendChatMessage, 
  getAvailableModels, 
  generateContent,
  generateImage
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

const generateImageValidation = [
  body('prompt')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Image prompt must be between 1 and 1000 characters'),
  body('size')
    .optional()
    .isIn(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
    .withMessage('Invalid image size'),
  body('style')
    .optional()
    .isIn(['vivid', 'natural'])
    .withMessage('Invalid style selection'),
  body('quality')
    .optional()
    .isIn(['standard', 'hd'])
    .withMessage('Invalid quality selection')
];

// Routes
router.post('/chat', chatMessageValidation, sendChatMessage);
router.get('/models', getAvailableModels);
router.post('/generate', generateContentValidation, generateContent);
router.post('/generate-image', generateImageValidation, generateImage);

export default router;