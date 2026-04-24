import { Router } from 'express';
import authRoutes from './auth.routes.js';
import groupRoutes from './groups.routes.js';
import expenseRoutes from './expenses.routes.js';
import balanceRoutes from './balances.routes.js';
import settlementRoutes from './settlements.routes.js';
import groupInviteRoutes from './group-invites.routes.js';
import inviteRoutes from './invites.routes.js';

const router: Router = Router();

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/groups', groupRoutes);
router.use('/api/groups', groupInviteRoutes);
router.use('/api/expenses', expenseRoutes);
router.use('/api', balanceRoutes);
router.use('/api/settlements', settlementRoutes);
router.use('/api/invites', inviteRoutes);

export default router;
