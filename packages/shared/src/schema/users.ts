/**
 * User schema - represents both customers and artisans
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Address } from '../types'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  phone: text('phone'),
  role: text('role', { enum: ['customer', 'artisan'] }).notNull(),
  defaultAddress: text('default_address', { mode: 'json' }).$type<Address>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
