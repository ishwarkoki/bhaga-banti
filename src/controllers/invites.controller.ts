import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { InviteService } from '../services/invite.service.js';
import {
  createInviteSchema,
  idParamSchema,
  groupIdParamSchema,
  tokenParamSchema,
} from '../utils/validators.js';
import { AppError } from '../middleware/error.js';

export const InviteController = {
  /**
   * @swagger
   * /api/groups/{groupId}/invites:
   *   post:
   *     summary: Create invite for a group
   *     tags: [Invites]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       201:
   *         description: Invite created
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
   *                     invite:
   *                       type: object
   *                     message:
   *                       type: string
   *       403:
   *         description: Admin access required
   */
  createInvite: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { groupId } = groupIdParamSchema.parse(req.params);
    const input = createInviteSchema.parse(req.body);
    const result = await InviteService.createInvite(groupId, req.user.id, input.email);

    res.status(201).json(result);
  }),

  /**
   * @swagger
   * /api/invites/{token}:
   *   get:
   *     summary: Validate an invite token
   *     tags: [Invites]
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Invite is valid
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
   *                     invite:
   *                       type: object
   *                     group:
   *                       type: object
   *                     invitedBy:
   *                       type: object
   *       400:
   *         description: Invite expired or already used
   *       404:
   *         description: Invalid invite
   */
  validateInvite: asyncHandler(async (req: Request, res: Response) => {
    const { token } = tokenParamSchema.parse(req.params);
    const result = await InviteService.validateInvite(token);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/invites/{token}/accept:
   *   post:
   *     summary: Accept an invite and join group
   *     tags: [Invites]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Joined group successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *       400:
   *         description: Already a member or invite invalid
   *       401:
   *         description: Unauthorized
   */
  acceptInvite: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { token } = tokenParamSchema.parse(req.params);
    const result = await InviteService.acceptInvite(token, req.user.id);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/groups/{groupId}/invites:
   *   get:
   *     summary: Get pending invites for a group
   *     tags: [Invites]
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
   *         description: List of pending invites
   *       403:
   *         description: Admin access required
   */
  getGroupInvites: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { groupId } = groupIdParamSchema.parse(req.params);
    const result = await InviteService.getGroupInvites(groupId, req.user.id);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/invites/{id}:
   *   delete:
   *     summary: Revoke an invite
   *     tags: [Invites]
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
   *         description: Invite revoked
   *       403:
   *         description: Admin access required
   */
  revokeInvite: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const result = await InviteService.revokeInvite(id, req.user.id);

    res.json(result);
  }),
};
