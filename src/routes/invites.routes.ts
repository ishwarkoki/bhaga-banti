import { Router } from 'express';
import { InviteController } from '../controllers/invites.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Invites
 *   description: Group invitation endpoints
 */

// Public routes (for validating/accepting invites)
router.get('/:token', InviteController.validateInvite);
router.post('/:token/accept', requireAuth, InviteController.acceptInvite);

// Protected routes (for creating/managing invites)
router.post('/groups/:groupId/invites', requireAuth, InviteController.createInvite);
router.get('/groups/:groupId/invites', requireAuth, InviteController.getGroupInvites);
router.delete('/:id', requireAuth, InviteController.revokeInvite);

export default router;
