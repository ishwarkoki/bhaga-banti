import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { logger, toLogError } from '../config/logger.js';
import { expenses, expenseSplits, groups, groupMembers, users } from '../db/schema/index.js';
import { AppError } from '../middleware/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';
import { GroupService } from './group.service.js';
import { EmailService } from './email.service.js';
import { validateSplits, splitEqual, formatCurrency } from '../utils/calculations.js';
import type { CreateExpenseInput, UpdateExpenseInput } from '../utils/validators.js';

export class ExpenseService {
  /**
   * Create a new expense
   */
  static async createExpense(paidBy: string, input: CreateExpenseInput) {
    const {
      groupId,
      amount,
      description,
      category,
      expenseDate,
      splitType,
      splits,
      notes,
      receiptUrl,
    } = input;

    // Check if user is member of group
    const isMember = await GroupService.isGroupMember(groupId, paidBy);
    if (!isMember) {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    // Validate splits sum to total amount
    const splitAmounts = splits.map((s) => ({ amount: s.amount }));
    if (!validateSplits(splitAmounts, amount)) {
      throw new AppError(ERROR_MESSAGES.INVALID_SPLIT, 400);
    }

    const expenseId = generateId();

    // Create expense
    const [expense] = await db
      .insert(expenses)
      .values({
        id: expenseId,
        groupId,
        paidBy,
        amount: amount.toString(),
        description,
        category,
        expenseDate,
        splitType,
        notes: notes || null,
        receiptUrl: receiptUrl || null,
      })
      .returning();

    // Create splits
    const splitRecords = splits.map((split) => ({
      id: generateId(),
      expenseId,
      userId: split.userId,
      amount: split.amount.toString(),
      percentage: split.percentage ? split.percentage.toString() : null,
    }));

    await db.insert(expenseSplits).values(splitRecords);

    // Get full expense with splits
    const fullExpense = await this.getExpenseById(expenseId);

    // Send notifications (async, don't wait)
    EmailService.notifyNewExpense(groupId, paidBy, amount, description).catch((error) => {
      logger.error('Failed to queue new expense email notification', {
        groupId,
        paidBy,
        amount,
        description,
        error: toLogError(error),
      });
    });

    return {
      success: true,
      data: fullExpense,
      message: SUCCESS_MESSAGES.EXPENSE_ADDED,
    };
  }

  /**
   * Get expense by ID
   */
  static async getExpenseById(expenseId: string) {
    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
      with: {
        payer: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        splits: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!expense) {
      throw new AppError(ERROR_MESSAGES.EXPENSE_NOT_FOUND, 404);
    }

    return {
      ...expense,
      amount: parseFloat(expense.amount as string),
    };
  }

  /**
   * Get expenses for a group
   */
  static async getGroupExpenses(
    groupId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Check access
    const isMember = await GroupService.isGroupMember(groupId, userId);
    if (!isMember) {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    const offset = (page - 1) * limit;

    const groupExpenses = await db.query.expenses.findMany({
      where: eq(expenses.groupId, groupId),
      with: {
        payer: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        splits: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [desc(expenses.expenseDate)],
      limit,
      offset,
    });

    // Get total count
    const countResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(expenses)
      .where(eq(expenses.groupId, groupId));

    const total = countResult[0]?.count || 0;

    // Parse amounts
    const parsedExpenses = groupExpenses.map((expense) => ({
      ...expense,
      amount: parseFloat(expense.amount as string),
      splits: expense.splits.map((split) => ({
        ...split,
        amount: parseFloat(split.amount as string),
        percentage: split.percentage ? parseFloat(split.percentage as string) : null,
      })),
    }));

    return {
      success: true,
      data: {
        expenses: parsedExpenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Update expense
   */
  static async updateExpense(expenseId: string, userId: string, input: UpdateExpenseInput) {
    const expense = await this.getExpenseById(expenseId);

    // Only payer or group admin can update
    const isPayer = expense.paidBy === userId;
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, expense.groupId), eq(groupMembers.userId, userId)),
    });

    if (!isPayer && membership?.role !== 'admin') {
      throw new AppError('Only payer or admin can update this expense', 403);
    }

    // Validate splits if provided
    if (input.splits) {
      const amount = input.amount || expense.amount;
      const splitAmounts = input.splits.map((s) => ({ amount: s.amount }));
      if (!validateSplits(splitAmounts, amount)) {
        throw new AppError(ERROR_MESSAGES.INVALID_SPLIT, 400);
      }
    }

    // Update expense
    const [updatedExpense] = await db
      .update(expenses)
      .set({
        ...(input.amount && { amount: input.amount.toString() }),
        ...(input.description && { description: input.description }),
        ...(input.category && { category: input.category }),
        ...(input.expenseDate && { expenseDate: input.expenseDate }),
        ...(input.notes !== undefined && { notes: input.notes }),
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    // Update splits if provided
    if (input.splits) {
      // Delete old splits
      await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));

      // Create new splits
      const splitRecords = input.splits.map((split) => ({
        id: generateId(),
        expenseId,
        userId: split.userId,
        amount: split.amount.toString(),
        percentage: split.percentage ? split.percentage.toString() : null,
      }));

      await db.insert(expenseSplits).values(splitRecords);
    }

    const fullExpense = await this.getExpenseById(expenseId);

    return {
      success: true,
      data: fullExpense,
      message: 'Expense updated successfully / ଖର୍ଚ୍ଚ ସଫଳତାର ସହ ଅପଡେଟ୍ ହେଲା',
    };
  }

  /**
   * Delete expense
   */
  static async deleteExpense(expenseId: string, userId: string) {
    const expense = await this.getExpenseById(expenseId);

    // Only payer or group admin can delete
    const isPayer = expense.paidBy === userId;
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, expense.groupId), eq(groupMembers.userId, userId)),
    });

    if (!isPayer && membership?.role !== 'admin') {
      throw new AppError('Only payer or admin can delete this expense', 403);
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    return {
      success: true,
      message: 'Expense deleted successfully / ଖର୍ଚ୍ଚ ସଫଳତାର ସହ ବିଲୋପ ହେଲା',
    };
  }

  /**
   * Calculate balances for a group
   */
  static async calculateGroupBalances(groupId: string) {
    // Get all expenses for group
    const groupExpenses = await db.query.expenses.findMany({
      where: eq(expenses.groupId, groupId),
      with: {
        payer: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        splits: {
          with: {
            user: {
              columns: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Calculate balances
    const balances: Record<
      string,
      {
        userId: string;
        name: string;
        email: string;
        image?: string | null;
        paid: number;
        owes: number;
        net: number;
      }
    > = {};

    for (const expense of groupExpenses) {
      const payerId = expense.paidBy;
      const amount = parseFloat(expense.amount as string);

      // Initialize payer if not exists
      if (!balances[payerId]) {
        balances[payerId] = {
          userId: payerId,
          name: expense.payer.name,
          email: expense.payer.email,
          image: expense.payer.image,
          paid: 0,
          owes: 0,
          net: 0,
        };
      }
      balances[payerId].paid += amount;

      // Process splits
      for (const split of expense.splits) {
        const splitUserId = split.userId;
        const splitAmount = parseFloat(split.amount as string);

        // Initialize user if not exists
        if (!balances[splitUserId]) {
          const user = await db.query.users.findFirst({
            where: eq(users.id, splitUserId),
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          });

          if (user) {
            balances[splitUserId] = {
              userId: splitUserId,
              name: user.name,
              email: user.email,
              image: user.image,
              paid: 0,
              owes: 0,
              net: 0,
            };
          }
        }

        if (balances[splitUserId]) {
          balances[splitUserId].owes += splitAmount;
        }
      }
    }

    // Calculate net balances
    const result = Object.values(balances).map((balance) => ({
      ...balance,
      net: Math.round((balance.paid - balance.owes) * 100) / 100,
    }));

    return result;
  }
}

export default ExpenseService;
