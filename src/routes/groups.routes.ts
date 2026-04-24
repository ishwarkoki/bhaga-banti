import { Router } from 'express';
import { GroupController } from '../controllers/groups.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management endpoints
 */

// Group CRUD
router.post('/', GroupController.createGroup);
router.get('/', GroupController.getUserGroups);
router.get('/:id', GroupController.getGroupById);
router.put('/:id', GroupController.updateGroup);
router.delete('/:id', GroupController.deleteGroup);

// Group members
router.get('/:id/members', GroupController.getGroupMembers);
router.post('/:id/members', GroupController.addMember);
router.delete('/:id/members/:userId', GroupController.removeMember);

export default router;
