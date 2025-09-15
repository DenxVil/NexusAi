import { Request, Response, NextFunction } from 'express';
import { ErrorMonitoringService } from '../services/errorMonitoringService';
import { v4 as uuidv4 } from 'uuid';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = async (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const requestId = uuidv4();

  // Enhanced error context
  const errorContext = {
    requestId,
    userId: (req as any).user?.id || 'anonymous',
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
  };

  // Log error for debugging
  console.error(`[${requestId}] Error ${statusCode}: ${message}`);
  console.error(`[${requestId}] Context:`, errorContext);
  console.error(`[${requestId}] Stack:`, error.stack);

  // Report to monitoring service for Telegram notifications
  try {
    const errorMonitor = ErrorMonitoringService.getInstance();
    await errorMonitor.reportError(error, errorContext);
  } catch (monitoringError) {
    console.error('Failed to report error to monitoring service:', monitoringError);
  }

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: {
      message: isDevelopment ? message : statusCode >= 500 ? 'Internal Server Error' : message,
      requestId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { 
        stack: error.stack,
        context: errorContext
      })
    }
  });
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error classes for better error handling
export class ValidationError extends Error {
  public statusCode = 400;
  public isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  public statusCode = 401;
  public isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  public statusCode = 403;
  public isOperational = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  public statusCode = 404;
  public isOperational = true;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public statusCode = 409;
  public isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  public statusCode = 429;
  public isOperational = true;

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServiceError extends Error {
  public statusCode = 503;
  public isOperational = true;

  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceError';
  }
}