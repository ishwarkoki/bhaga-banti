import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { ExpenseService } from '../services/expense.service.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  idParamSchema,
  paginationSchema,
  groupIdParamSchema,
} from '../utils/validators.js';
import { AppError } from '../middleware/error.js';

export const ExpenseController = {
  /**
   * @swagger
   * /api/expenses:
   *   post:
   *     summary: Create a new expense
   *     tags: [Expenses]
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
   *               - amount
   *               - description
   *               - splits
   *             properties:
   *               groupId:
   *                 type: string
   *                 format: uuid
   *               amount:
   *                 type: number
   *                 minimum: 0
   *               description:
   *                 type: string
   *                 maxLength: 500
   *               category:
   *                 type: string
   *                 enum: [food, transportation, housing, utilities, entertainment, shopping, health, travel, education, personal, other]
   *               expenseDate:
   *                 type: string
   *                 format: date-time
   *               splitType:
   *                 type: string
   *                 enum: [equal, exact, percentage, shares]
   *               splits:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     userId:
   *                       type: string
   *                     amount:
   *                       type: number
   *                     percentage:
   *                       type: number
   *               notes:
   *                 type: string
   *               receiptUrl:
   *                 type: string
   *     responses:
   *       201:
   *         description: Expense created
   *       400:
   *         description: Validation error
   *       403:
   *         description: Access denied
   */
  createExpense: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const input = createExpenseSchema.parse(req.body);
    const result = await ExpenseService.createExpense(req.user.id, input);

    res.status(201).json(result);
  }),

  /**
   * @swagger
   * /api/groups/{groupId}/expenses:
   *   get:
   *     summary: Get expenses for a group
   *     tags: [Expenses]
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
   *         description: List of expenses
   *       403:
   *         description: Access denied
   */
  getGroupExpenses: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { groupId } = groupIdParamSchema.parse(req.params);
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await ExpenseService.getGroupExpenses(groupId, req.user.id, page, limit);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/expenses/{id}:
   *   get:
   *     summary: Get expense by ID
   *     tags: [Expenses]
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
   *         description: Expense details
   *       404:
   *         description: Expense not found
   */
  getExpenseById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const expense = await ExpenseService.getExpenseById(id);

    res.json({
      success: true,
      data: expense,
    });
  }),

  /**
   * @swagger
   * /api/expenses/{id}:
   *   put:
   *     summary: Update expense
   *     tags: [Expenses]
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
   *               amount:
   *                 type: number
   *               description:
   *                 type: string
   *               category:
   *                 type: string
   *               expenseDate:
   *                 type: string
   *                 format: date-time
   *               splits:
   *                 type: array
   *                 items:
   *                   type: object
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Expense updated
   *       403:
   *         description: Only payer or admin can update
   */
  updateExpense: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const input = updateExpenseSchema.parse(req.body);
    const result = await ExpenseService.updateExpense(id, req.user.id, input);

    res.json(result);
  }),

  /**
   * @swagger
   * /api/expenses/{id}:
   *   delete:
   *     summary: Delete expense
   *     tags: [Expenses]
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
   *         description: Expense deleted
   *       403:
   *         description: Only payer or admin can delete
   */
  deleteExpense: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = idParamSchema.parse(req.params);
    const result = await ExpenseService.deleteExpense(id, req.user.id);

    res.json(result);
  }),
};
