/**
 * Order schema - customer orders and order items
 */

import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => users.id),
  status: text('status', {
    enum: [
      'pending_payment',
      'paid',
      'in_queue',
      'in_production',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ],
  }).notNull(),
  subtotal: integer('subtotal').notNull(), // in cents
  tax: integer('tax').notNull(), // in cents
  shipping: integer('shipping').notNull(), // in cents
  discount: integer('discount').notNull().default(0), // in cents
  total: integer('total').notNull(), // in cents
  shippingAddress: text('shipping_address', { mode: 'json' }).notNull().$type<{
    street: string
    city: string
    state: string
    zip: string
    country: string
  }>(),
  trackingNumber: text('tracking_number'),
  paymentIntentId: text('payment_intent_id'),
  discountCodeId: text('discount_code_id'),
  modificationWindowHours: integer('modification_window_hours').notNull().default(12),
  queuePosition: integer('queue_position'),
  estimatedDeliveryDate: integer('estimated_delivery_date', { mode: 'timestamp' }),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  itemType: text('item_type', { enum: ['project', 'pattern', 'merch'] }).notNull(),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(), // in cents (snapshot)
  selectedOptions: text('selected_options', { mode: 'json' }).$type<Record<string, unknown>>(),
  taxRate: real('tax_rate').notNull(), // e.g., 0.08 for 8%
  taxAmount: integer('tax_amount').notNull(), // in cents
  subtotal: integer('subtotal').notNull(), // in cents
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
