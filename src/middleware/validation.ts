import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Validate request body
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        next(result.error);
        return;
      }

      // Attach validated data to request
      (req as any).validatedBody = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Validate request params
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        next(result.error);
        return;
      }

      (req as any).validatedParams = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Validate request query
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        next(result.error);
        return;
      }

      (req as any).validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Get validated data from request
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedParams?: any;
      validatedQuery?: any;
    }
  }
}
