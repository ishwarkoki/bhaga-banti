import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { SettlementService } from '../services/settlement.service.js';
import {
  createSettlementSchema,
  idParamSchema,
  paginationSchema,
  groupIdParamSchema,
} from '../utils/validators.js';
import { AppError } from '../middleware/error.js';

export const SettlementController = {
  /**
   * @swagger
   * /api/settlements:
   *   post:
   *     summary: Record a settlement
   *     tags: [Settlements]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - groupId
   *               - toUserId
   *               - amount
   *             properties:
   *               groupId:
   *                 type: string
   *                 format: uuid
   *               toUserId:
   *                 type: string
   *                 format: uuid
   *               amount:
   *                 type: number
   *                 minimum: 0
   *               method:
   *                 type: string
   *                 enum: [cash, upi, bank_transfer, other]
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Settlement recorded
   *       400:
   *         description: Cannot settle with yourself
   *       403:
   *         description: Access denied
   */
  createSettlement: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const input = createSettlementSchema.parse(req.body);
    const result = await SettlementService.createSettlement(req.user.id, input);

    res.status(201).json(result);
  }),

  /**
   * @swagger
   * /api/groups/{groupId}/settlements:
   *   get:
   *     summary: Get settlements for a group
   *     tags: [Settlements]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: List of settlements
   *       403:
   *         description: Access denied
   */
  getGroupSettlements: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { groupId } = groupIdParamSchema.parse(req.params);
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await SettlementService.getGroupSettlements(groupId, req.user.id, page, limit);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/settlements/user:
   *   get:
   *     summary: Get settlements involving current user
   *     tags: [Settlements]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: List of user's settlements
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
   *                     settlements:
   *                       type: array
   *                       items:
   *                         type: object
   *                     pagination:
   *                       type: object
   *       401:
   *         description: Unauthorized
   */
  getUserSettlements: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { page, limit } = paginationSchema.parse(req.query);
    const result = await SettlementService.getUserSettlements(req.user.id, page, limit);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/settlements/{id}:
   *   delete:
   *     summary: Delete a settlement
   *     tags: [Settlements]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Settlement deleted
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Settlement not found
   */
  deleteSettlement: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const result = await SettlementService.deleteSettlement(id, req.user.id);

    res.json(result);
  }),
};
