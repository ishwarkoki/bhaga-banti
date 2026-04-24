import { Router } from 'express';
import { BalanceController } from '../controllers/balances.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Balances
 *   description: Balance and debt calculation endpoints
 */

// Group balances
router.get('/groups/:groupId/balances', requireAuth, BalanceController.getGroupBalances);
router.get('/groups/:groupId/simplify', requireAuth, BalanceController.getSimplifiedDebts);

// User total balance
router.get('/balances', requireAuth, BalanceController.getUserTotalBalance);

export default router;
