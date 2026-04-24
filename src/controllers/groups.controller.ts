import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { GroupService } from '../services/group.service.js';
import {
  createGroupSchema,
  updateGroupSchema,
  idParamSchema,
  paginationSchema,
  groupMemberParamSchema,
} from '../utils/validators.js';
import { AppError } from '../middleware/error.js';

export const GroupController = {
  /**
   * @swagger
   * /api/groups:
   *   post:
   *     summary: Create a new group
   *     tags: [Groups]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *               description:
   *                 type: string
   *                 maxLength: 1000
   *     responses:
   *       201:
   *         description: Group created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  createGroup: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const input = createGroupSchema.parse(req.body);
    const result = await GroupService.createGroup(req.user.id, input);

    res.status(201).json(result);
  }),

  /**
   * @swagger
   * /api/groups:
   *   get:
   *     summary: Get all groups for current user
   *     tags: [Groups]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *     responses:
   *       200:
   *         description: List of user's groups
   *       401:
   *         description: Unauthorized
   */
  getUserGroups: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { page, limit } = paginationSchema.parse(req.query);
    const result = await GroupService.getUserGroups(req.user.id, page, limit);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/groups/{id}:
   *   get:
   *     summary: Get group by ID
   *     tags: [Groups]
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
   *         description: Group details
   *       403:
   *         description: Access denied
   *       404:
   *         description: Group not found
   */
  getGroupById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const result = await GroupService.getGroupById(id, req.user.id);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/groups/{id}:
   *   put:
   *     summary: Update group
   *     tags: [Groups]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               defaultSplitType:
   *                 type: string
   *                 enum: [equal, exact, percentage, shares]
   *     responses:
   *       200:
   *         description: Group updated
   *       403:
   *         description: Admin access required
   *       404:
   *         description: Group not found
   */
  updateGroup: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const input = updateGroupSchema.parse(req.body);
    const result = await GroupService.updateGroup(id, req.user.id, input);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/groups/{id}:
   *   delete:
   *     summary: Delete group
   *     tags: [Groups]
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
   *         description: Group deleted
   *       403:
   *         description: Admin access required
   */
  deleteGroup: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const result = await GroupService.deleteGroup(id, req.user.id);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/groups/{id}/members:
   *   get:
   *     summary: Get group members
   *     tags: [Groups]
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
   *         description: List of members
   *       403:
   *         description: Access denied
   */
  getGroupMembers: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);

    // Check access first
    const isMember = await GroupService.isGroupMember(id, req.user.id);
    if (!isMember) {
      throw new AppError('Access denied', 403);
    }

    const members = await GroupService.getGroupMembers(id);

    res.json({
      success: true,
      data: members,
    });
  }),

  /**
   * @swagger
   * /api/groups/{id}/members:
   *   post:
   *     summary: Add member to group
   *     tags: [Groups]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       200:
   *         description: Member added
   *       400:
   *         description: Already a member
   *       403:
   *         description: Admin access required
   */
  addMember: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const { userId } = req.body;

    if (!userId) {
      throw new AppError('userId is required', 400);
    }

    const result = await GroupService.addMember(id, req.user.id, userId);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/groups/{id}/members/{userId}:
   *   delete:
   *     summary: Remove member from group
   *     tags: [Groups]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Member removed
   *       403:
   *         description: Admin access required
   */
  removeMember: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id, userId } = groupMemberParamSchema.parse(req.params);
    const result = await GroupService.removeMember(id, req.user.id, userId);

    res.json(result);
  }),
};
