/**
 * Queue schema - production queue management
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { orders } from './orders'

export const queueEntries = sqliteTable('queue_entries', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  weight: integer('weight').notNull(),
  enteredAt: integer('entered_at', { mode: 'timestamp' }).notNull(),
  estimatedCompletionAt: integer('estimated_completion_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const queueConfig = sqliteTable('queue_config', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => 'default'),
  weeklyCapacity: integer('weekly_capacity').notNull().default(10),
  isPaused: integer('is_paused', { mode: 'boolean' }).notNull().default(false),
  pausedReason: text('paused_reason'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type QueueEntry = typeof queueEntries.$inferSelect
export type NewQueueEntry = typeof queueEntries.$inferInsert
export type QueueConfig = typeof queueConfig.$inferSelect
export type NewQueueConfig = typeof queueConfig.$inferInsert
