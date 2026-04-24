import { pgTable, varchar, timestamp, text, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { groups } from './groups.js';
import { relations } from 'drizzle-orm';

export const splitTypeEnum = pgEnum('split_type', ['equal', 'exact', 'percentage', 'shares']);
export const expenseCategoryEnum = pgEnum('expense_category', [
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
]);

export const expenses = pgTable('expense', {
  id: varchar('id', { length: 255 }).primaryKey(),
  groupId: varchar('group_id', { length: 255 })
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  paidBy: varchar('paid_by', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  category: expenseCategoryEnum('category').default('other'),
  expenseDate: timestamp('expense_date').notNull().defaultNow(),
  splitType: splitTypeEnum('split_type').notNull().default('equal'),
  notes: text('notes'),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  isRecurring: varchar('is_recurring', { length: 10 }).default('false'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const expenseSplits = pgTable('expense_split', {
  id: varchar('id', { length: 255 }).primaryKey(),
  expenseId: varchar('expense_id', { length: 255 })
    .notNull()
    .references(() => expenses.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  shares: numeric('shares', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, {
    fields: [expenses.groupId],
    references: [groups.id],
  }),
  payer: one(users, {
    fields: [expenses.paidBy],
    references: [users.id],
  }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(users, {
    fields: [expenseSplits.userId],
    references: [users.id],
  }),
}));

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type NewExpenseSplit = typeof expenseSplits.$inferInsert;
