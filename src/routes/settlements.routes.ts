import { Router } from 'express';
import { SettlementController } from '../controllers/settlements.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Settlements
 *   description: Settlement/Payment recording endpoints
 */

// Settlement routes
router.post('/', requireAuth, SettlementController.createSettlement);
router.get('/user', requireAuth, SettlementController.getUserSettlements);
router.get('/group/:groupId', requireAuth, SettlementController.getGroupSettlements);
router.delete('/:id', requireAuth, SettlementController.deleteSettlement);

export default router;
