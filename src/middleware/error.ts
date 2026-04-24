import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger, toLogError } from '../config/logger.js';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Default error response
  let statusCode = 500;
  let error = 'Internal Server Error';
  let message = 'Something went wrong / କିଛି ଭୁଲ ହୋଇଗଲା';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    error = 'Validation Error';
    message = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  }
  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    error = err.message;
    message = err.message;
  }
  // Handle other errors
  else if (err.message) {
    error = err.message;
    message = err.message;
  }

  logger.error('Request failed', {
    requestId: res.locals.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error,
    details: err instanceof ZodError ? err.issues : undefined,
    cause: toLogError(err),
  });

  res.status(statusCode).json({
    success: false,
    error,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found / ରୁଟ୍ ମିଳୁନାହିଁ`,
  });
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
