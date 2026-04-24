import { pgTable, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { groups } from './groups';

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
]);

export const invitations = pgTable('invitations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  groupId: varchar('group_id', { length: 36 })
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  invitedBy: varchar('invited_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  email: varchar('email', { length: 255 }), // Optional: for email invites
  status: invitationStatusEnum('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedBy: varchar('accepted_by', { length: 36 }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
