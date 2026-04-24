import { pgTable, varchar, text, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { groups } from './groups';

export const settlementMethodEnum = pgEnum('settlement_method', [
  'cash',
  'upi',
  'bank_transfer',
  'other',
]);

export const settlements = pgTable('settlements', {
  id: varchar('id', { length: 36 }).primaryKey(),
  groupId: varchar('group_id', { length: 36 })
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  fromUserId: varchar('from_user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  toUserId: varchar('to_user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  method: settlementMethodEnum('method').default('cash').notNull(),
  notes: text('notes'),
  settledAt: timestamp('settled_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
