import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth.js';
import { AppError, asyncHandler } from './error.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        image?: string | null;
      };
      session?: {
        id: string;
        token: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}

// Auth middleware - verify user is logged in
export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const headers = new Headers();

  // Copy headers from Express request
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0] : value);
    }
  });

  const session = await auth.api.getSession({
    headers,
  });

  if (!session || !session.user) {
    throw new AppError('Unauthorized / ଅନାଧିକୃତ', 401);
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };

  req.session = {
    id: session.session.id,
    token: session.session.token,
    userId: session.session.userId,
    expiresAt: session.session.expiresAt,
  };

  next();
});

// Optional auth - doesn't throw if not logged in
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const headers = new Headers();

      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, Array.isArray(value) ? value[0] : value);
        }
      });

      const session = await auth.api.getSession({
        headers,
      });

      if (session && session.user) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        };

        req.session = {
          id: session.session.id,
          token: session.session.token,
          userId: session.session.userId,
          expiresAt: session.session.expiresAt,
        };
      }
    } catch (error) {
      // Silent fail - user is not authenticated
    }

    next();
  },
);
