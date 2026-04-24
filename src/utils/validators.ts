import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid();
export const idParamSchema = z.object({
  id: uuidSchema,
});
export const groupIdParamSchema = z.object({
  groupId: uuidSchema,
});
export const tokenParamSchema = z.object({
  token: z.string().min(1),
});
export const groupMemberParamSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Group schemas
export const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  defaultSplitType: z.enum(['equal', 'exact', 'percentage', 'shares']).optional(),
});

// Member schemas
export const addMemberSchema = z.object({
  email: z.string().email(),
});

// Expense schemas
export const expenseSplitSchema = z.object({
  userId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  percentage: z.coerce.number().min(0).max(100).optional(),
  shares: z.coerce.number().positive().optional(),
});

export const createExpenseSchema = z.object({
  groupId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  description: z.string().min(1).max(500),
  category: z
    .enum([
      'food',
      'transportation',
      'housing',
      'utilities',
      'entertainment',
      'shopping',
      'health',
      'travel',
      'education',
      'personal',
      'other',
    ])
    .default('other'),
  expenseDate: z.coerce.date(),
  splitType: z.enum(['equal', 'exact', 'percentage', 'shares']).default('equal'),
  splits: z.array(expenseSplitSchema).min(1),
  notes: z.string().max(1000).optional(),
  receiptUrl: z.string().url().max(500).optional(),
});

export const updateExpenseSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  category: z
    .enum([
      'food',
      'transportation',
      'housing',
      'utilities',
      'entertainment',
      'shopping',
      'health',
      'travel',
      'education',
      'personal',
      'other',
    ])
    .optional(),
  expenseDate: z.coerce.date().optional(),
  splits: z.array(expenseSplitSchema).min(1).optional(),
  notes: z.string().max(1000).optional(),
});

// Settlement schema
export const createSettlementSchema = z.object({
  groupId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(['cash', 'upi', 'bank_transfer', 'other']).default('cash'),
  notes: z.string().max(1000).optional(),
});

// Invite schema
export const createInviteSchema = z.object({
  email: z.string().email().optional(),
});

// Types
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
