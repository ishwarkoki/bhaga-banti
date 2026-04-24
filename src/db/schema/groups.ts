import { pgTable, varchar, timestamp, text, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { relations } from 'drizzle-orm';

export const memberRoleEnum = pgEnum('member_role', ['admin', 'member']);

export const groups = pgTable('group', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: varchar('created_by', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  defaultSplitType: varchar('default_split_type', { length: 50 }).default('equal'),
  currency: varchar('currency', { length: 10 }).default('INR'),
  isArchived: varchar('is_archived', { length: 10 }).default('false'),
  avatar: varchar('avatar', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupMembers = pgTable('group_member', {
  id: varchar('id', { length: 255 }).primaryKey(),
  groupId: varchar('group_id', { length: 255 })
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const groupsRelations = relations(groups, ({ many, one }) => ({
  members: many(groupMembers),
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
