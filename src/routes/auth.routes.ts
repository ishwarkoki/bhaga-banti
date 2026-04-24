import { Router } from 'express';
import { auth } from '../config/auth.js';
import { toNodeHandler } from 'better-auth/node';
import { authRateLimiter } from '../middleware/rate-limit.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication endpoints (Better Auth)
 */

// Apply rate limiting to auth routes
router.use(authRateLimiter);

// Better Auth handles all auth routes automatically
router.use(toNodeHandler(auth));

export default router;
