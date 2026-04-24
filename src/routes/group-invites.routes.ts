import { Router } from 'express';
import { InviteController } from '../controllers/invites.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

router.post('/:groupId/invites', requireAuth, InviteController.createInvite);
router.get('/:groupId/invites', requireAuth, InviteController.getGroupInvites);

export default router;
