import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { BalanceService } from '../services/balance.service.js';
import { groupIdParamSchema } from '../utils/validators.js';
import { AppError } from '../middleware/error.js';

export const BalanceController = {
  /**
   * @swagger
   * /api/groups/{groupId}/balances:
   *   get:
   *     summary: Get balances for a group
   *     tags: [Balances]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Group balances
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     group:
   *                       type: object
   *                     balances:
   *                       type: array
   *                       items:
   *                         type: object
   *       403:
   *         description: Access denied
   *       404:
   *         description: Group not found
   */
  getGroupBalances: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { groupId } = groupIdParamSchema.parse(req.params);
    const result = await BalanceService.getGroupBalances(groupId, req.user.id);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/groups/{groupId}/simplify:
   *   get:
   *     summary: Get simplified debts for a group
   *     tags: [Balances]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Simplified debts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     group:
   *                       type: object
   *                     originalBalances:
   *                       type: array
   *                     simplifiedDebts:
   *                       type: array
   *                     totalTransactions:
   *                       type: integer
   *       403:
   *         description: Access denied
   */
  getSimplifiedDebts: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { groupId } = groupIdParamSchema.parse(req.params);
    const result = await BalanceService.getSimplifiedDebts(groupId, req.user.id);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/balances:
   *   get:
   *     summary: Get user's total balance across all groups
   *     tags: [Balances]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: User's total balance
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalOwed:
   *                       type: number
   *                     totalOwes:
   *                       type: number
   *                     netBalance:
   *                       type: number
   *                     groupBalances:
   *                       type: array
   *       401:
   *         description: Unauthorized
   */
  getUserTotalBalance: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const result = await BalanceService.getUserTotalBalance(req.user.id);

    res.json(result);
  }),
};
