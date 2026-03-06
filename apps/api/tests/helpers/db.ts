/**
 * Runs all SQL migrations against an in-memory test database.
 *
 * Reads the migration files directly so tests always reflect the current
 * schema without requiring a running Wrangler process. Each statement is
 * split on the Drizzle `statement-breakpoint` comment that wrangler uses.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { createTestClient } from '@artisan-commerce/db'

// Absolute path to the migrations directory so the helper works regardless
// of the current working directory when tests are run.
const MIGRATIONS_DIR = join(import.meta.dirname, '../../drizzle/migrations')

// Auto-discover all .sql migration files and sort them by name
const MIGRATION_FILES = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort()

type TestDb = ReturnType<typeof createTestClient>

/**
 * Apply all migrations to an in-memory SQLite test database.
 * Call once per test (inside beforeEach) with a fresh createTestClient().
 */
export function runMigrations(db: TestDb): void {
  // Access the underlying better-sqlite3 driver to run raw SQL.
  // Drizzle exposes this via the non-standard `$client` property.
  const driver = (db as unknown as { $client: { exec: (sql: string) => void } }).$client

  for (const file of MIGRATION_FILES) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
    // Split on Drizzle's statement-breakpoint marker; filter empty strings.
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)

    for (const stmt of statements) {
      driver.exec(stmt)
    }
  }
}
