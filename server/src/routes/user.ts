import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { registerUser, loginUser } from '../controllers/userController';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Route for user registration
router.post(
  '/register',
  [
    body('username').isString().notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  validateRequest,
  (req: Request, res: Response) => registerUser(req, res)
);

// Route for user login
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  (req: Request, res: Response) => loginUser(req, res)
);

export default router;
