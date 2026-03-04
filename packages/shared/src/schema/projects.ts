/**
 * Project schema - made-to-order handmade items
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: text('type', {
    enum: ['crochet', 'knitting', 'embroidery', 'cross_stitch', 'sewn'],
  }).notNull(),
  basePrice: integer('base_price').notNull(), // in cents
  productionTimeWeeks: integer('production_time_weeks').notNull(),
  queueTier: text('queue_tier', {
    enum: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
  }).notNull(),
  patternId: text('pattern_id'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const projectImages = sqliteTable('project_images', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const projectOptions = sqliteTable('project_options', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  optionType: text('option_type', {
    enum: ['material', 'color', 'size', 'custom_text'],
  }).notNull(),
  optionValue: text('option_value').notNull(),
  priceModifier: integer('price_modifier').notNull().default(0), // in cents
  dependencies: text('dependencies', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectImage = typeof projectImages.$inferSelect
export type NewProjectImage = typeof projectImages.$inferInsert
export type ProjectOption = typeof projectOptions.$inferSelect
export type NewProjectOption = typeof projectOptions.$inferInsert
