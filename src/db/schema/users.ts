import { pgTable, varchar, timestamp, text, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: varchar('image', { length: 500 }),
  role: userRoleEnum('role').default('user').notNull(),
  // Bhaga-banti specific fields
  phone: varchar('phone', { length: 20 }),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata'),
  upiId: varchar('upi_id', { length: 100 }), // For Indian UPI payments
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
