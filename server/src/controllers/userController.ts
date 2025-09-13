import { Request, Response } from 'express';
import { register, login } from './authController';

// Wrapper functions to match the expected naming in user routes
export const registerUser = (req: Request, res: Response) => {
  return register(req, res);
};

export const loginUser = (req: Request, res: Response) => {
  return login(req, res);
};