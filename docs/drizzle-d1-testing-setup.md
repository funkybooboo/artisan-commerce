# Drizzle ORM + Cloudflare D1 Testing & CI/CD Setup Guide

Complete guide for setting up Drizzle ORM with Cloudflare D1, testing strategies, and CI/CD integration in a monorepo.

## Table of Contents

1. [Dependencies & Installation](#dependencies--installation)
2. [Drizzle ORM Setup with D1](#drizzle-orm-setup-with-d1)
3. [Migration Workflow](#migration-workflow)
4. [Local Development](#local-development)
5. [Testing Strategy](#testing-strategy)
6. [Playwright E2E Testing](#playwright-e2e-testing)
7. [CI/CD Integration](#cicd-integration)
8. [Monorepo Package Scripts](#monorepo-package-scripts)

---

## Dependencies & Installation

### Core Dependencies

```bash
# Drizzle ORM and Kit
npm install drizzle-orm
npm install -D drizzle-kit

# Cloudflare D1 Client
npm install @cloudflare/d1

# Better-sqlite3 for local development
npm install better-sqlite3
npm install -D @types/better-sqlite3

# Testing dependencies
npm install -D vitest @vitest/ui
npm install -D @playwright/test
```

### Optional Dependencies

```bash
# For Cloudflare Workers development
npm install -D wrangler

# For TypeScript support
npm install -D tsx
```

---

## Drizzle ORM Setup with D1

### 1. Project Structure

```
artisan-commerce/
├── packages/
│   └── database/
│       ├── drizzle/                 # Generated migrations
│       │   ├── 0000_initial.sql
│       │   └── meta/
│       ├── src/
│       │   ├── schema/
│       │   │   ├── users.ts
│       │   │   ├── products.ts
│       │   │   └── index.ts
│       │   ├── client.ts            # Database client factory
│       │   └── index.ts
│       ├── drizzle.config.ts        # Drizzle Kit config
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── web/
│       ├── wrangler.toml            # Cloudflare Workers config
│       └── src/
│           └── index.ts
├── .local/
│   └── db.sqlite                    # Local SQLite file
└── package.json
```

### 2. Database Schema Definition

**packages/database/src/schema/users.ts**
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**packages/database/src/schema/products.ts**
```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  stock: integer('stock').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

**packages/database/src/schema/index.ts**
```typescript
export * from './users';
export * from './products';
```

### 3. Database Client Factory

**packages/database/src/client.ts**
```typescript
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleBetterSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Type for D1 database binding (Cloudflare Workers)
export type D1Database = any; // Replace with actual D1Database type

// Client for Cloudflare D1 (production/preview)
export function createD1Client(d1: D1Database) {
  return drizzleD1(d1, { schema });
}

// Client for local development (better-sqlite3)
export function createLocalClient(dbPath: string = './.local/db.sqlite') {
  const sqlite = new Database(dbPath);
  return drizzleBetterSqlite(sqlite, { schema });
}

// Unified client type
export type DatabaseClient = ReturnType<typeof createD1Client>;
```

**packages/database/src/index.ts**
```typescript
export * from './schema';
export * from './client';
```

### 4. Drizzle Kit Configuration

**packages/database/drizzle.config.ts**
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  
  // Use better-sqlite3 for local development
  driver: 'better-sqlite3',
  dbCredentials: {
    url: './.local/db.sqlite',
  },
  
  // Migration settings
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
  },
  
  verbose: true,
  strict: true,
});
```

---

## Migration Workflow

### Generating Migrations

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Output:
# drizzle/
# ├── 0000_20250103120530_initial.sql
# ├── meta/
# │   ├── 0000_snapshot.json
# │   └── _journal.json
```

### Running Migrations

#### Local Development (better-sqlite3)

```bash
# Apply migrations locally
npx drizzle-kit migrate

# Or run migrations programmatically
npx tsx scripts/migrate-local.ts
```

**scripts/migrate-local.ts**
```typescript
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createLocalClient } from '../packages/database/src';

const db = createLocalClient('./.local/db.sqlite');

async function runMigrations() {
  console.log('Running migrations...');
  
  await migrate(db, {
    migrationsFolder: './packages/database/drizzle',
  });
  
  console.log('Migrations completed!');
}

runMigrations().catch(console.error);
```

#### Production (Cloudflare D1)

```bash
# Create D1 database (first time only)
npx wrangler d1 create artisan-commerce-prod

# Apply migrations to remote D1
npx wrangler d1 migrations apply artisan-commerce-prod --remote

# Apply migrations locally (for testing)
npx wrangler d1 migrations apply artisan-commerce-prod --local
```

### Migration Commands Summary

| Command | Purpose | Environment |
|---------|---------|-------------|
| `drizzle-kit generate` | Generate SQL from schema changes | Local |
| `drizzle-kit migrate` | Apply to local better-sqlite3 | Local |
| `wrangler d1 migrations apply --local` | Apply to local Wrangler D1 | Local |
| `wrangler d1 migrations apply --remote` | Apply to production D1 | Production |

---

## Local Development

### Setup Local Database

**scripts/setup-local-db.sh**
```bash
#!/bin/bash

# Create .local directory
mkdir -p .local

# Initialize local SQLite database
touch .local/db.sqlite

# Run migrations
cd packages/database
npx drizzle-kit migrate

echo "Local database setup complete!"
```

### Seed Local Database

**scripts/seed-local.ts**
```typescript
import { createLocalClient } from '../packages/database/src';
import { users, products } from '../packages/database/src/schema';

const db = createLocalClient('./.local/db.sqlite');

async function seed() {
  console.log('Seeding database...');
  
  // Insert test users
  await db.insert(users).values([
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com', name: 'Bob' },
  ]);
  
  // Insert test products
  await db.insert(products).values([
    { name: 'Widget', description: 'A useful widget', price: 19.99, stock: 100 },
    { name: 'Gadget', description: 'An awesome gadget', price: 29.99, stock: 50 },
  ]);
  
  console.log('Seeding completed!');
}

seed().catch(console.error);
```

### Environment Configuration

**.env.example**
```env
# Local Development
DATABASE_URL=./.local/db.sqlite

# Cloudflare D1 (Production)
D1_DATABASE_ID=your-database-id
D1_DATABASE_NAME=artisan-commerce-prod
```

---

## Testing Strategy

### Testing Pyramid

```
           E2E Tests (Playwright)
              Few, slow
                  │
                  ▼
        Integration Tests (Vitest)
           Some, medium speed
                  │
                  ▼
           Unit Tests (Vitest)
          Many, fast, isolated
```

### 1. Unit Tests (Vitest)

Test individual functions and pure logic without database.

**packages/database/src/schema/users.test.ts**
```typescript
import { describe, it, expect } from 'vitest';
import { users } from './users';

describe('User Schema', () => {
  it('should have required fields', () => {
    expect(users.email).toBeDefined();
    expect(users.name).toBeDefined();
  });
  
  it('should infer correct types', () => {
    type User = typeof users.$inferSelect;
    type NewUser = typeof users.$inferInsert;
    
    // Type assertions
    const user: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    };
    
    expect(user).toBeDefined();
  });
});
```

### 2. Integration Tests (Vitest + In-Memory SQLite)

Test database operations with an in-memory database.

**packages/database/src/repositories/users.test.ts**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { users } from '../schema';

describe('User Repository Integration Tests', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;
  
  beforeEach(async () => {
    // Create in-memory database
    sqlite = new Database(':memory:');
    db = drizzle(sqlite, { schema });
    
    // Apply migrations
    await migrate(db, {
      migrationsFolder: './drizzle',
    });
  });
  
  afterEach(() => {
    sqlite.close();
  });
  
  it('should insert and retrieve a user', async () => {
    // Insert user
    const newUser = {
      email: 'test@example.com',
      name: 'Test User',
    };
    
    await db.insert(users).values(newUser);
    
    // Retrieve user
    const retrievedUsers = await db.select().from(users);
    
    expect(retrievedUsers).toHaveLength(1);
    expect(retrievedUsers[0].email).toBe(newUser.email);
    expect(retrievedUsers[0].name).toBe(newUser.name);
  });
  
  it('should enforce unique email constraint', async () => {
    const user = {
      email: 'duplicate@example.com',
      name: 'User 1',
    };
    
    await db.insert(users).values(user);
    
    // Attempt duplicate insert
    await expect(
      db.insert(users).values(user)
    ).rejects.toThrow();
  });
});
```

### 3. Vitest Configuration

**packages/database/vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'drizzle/',
        '**/*.test.ts',
      ],
    },
  },
});
```

---

## Playwright E2E Testing

### 1. Playwright Installation

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### 2. Playwright Configuration

**apps/web/playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
  },
  
  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  
  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 3. E2E Test Examples

**apps/web/e2e/database.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Database Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });
  
  test('should display users from database', async ({ page }) => {
    // Navigate to users page
    await page.goto('/users');
    
    // Check that users are loaded
    const userList = page.locator('[data-testid="user-list"]');
    await expect(userList).toBeVisible();
    
    // Verify user count
    const userItems = page.locator('[data-testid="user-item"]');
    await expect(userItems).toHaveCount(2);
  });
  
  test('should create a new user', async ({ page }) => {
    await page.goto('/users/new');
    
    // Fill form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="name"]', 'New User');
    
    // Submit
    await page.click('[type="submit"]');
    
    // Verify redirect and success
    await expect(page).toHaveURL('/users');
    await expect(page.locator('text=New User')).toBeVisible();
  });
});
```

### 4. Test Database Setup

**apps/web/e2e/setup/global-setup.ts**
```typescript
import { chromium, FullConfig } from '@playwright/test';
import { createLocalClient } from '@artisan-commerce/database';
import { users, products } from '@artisan-commerce/database/schema';

async function globalSetup(config: FullConfig) {
  console.log('Setting up test database...');
  
  // Use a separate test database
  const db = createLocalClient('./.local/db.test.sqlite');
  
  // Clear existing data
  await db.delete(users);
  await db.delete(products);
  
  // Seed test data
  await db.insert(users).values([
    { email: 'test1@example.com', name: 'Test User 1' },
    { email: 'test2@example.com', name: 'Test User 2' },
  ]);
  
  await db.insert(products).values([
    { name: 'Test Product', price: 9.99, stock: 10 },
  ]);
  
  console.log('Test database setup complete!');
}

export default globalSetup;
```

---

## CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/test.yml**
```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 30

  migrations:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate migrations
        run: npm run db:generate
      
      - name: Check for uncommitted migrations
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "Uncommitted migration files detected!"
            git diff
            exit 1
          fi

  deploy:
    needs: [test, migrations]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Cloudflare
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: npm run deploy
      
      - name: Run production migrations
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: npx wrangler d1 migrations apply artisan-commerce-prod --remote
```

---

## Monorepo Package Scripts

### Root package.json

**package.json**
```json
{
  "name": "artisan-commerce",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:integration": "turbo run test:integration",
    "test:e2e": "turbo run test:e2e",
    "lint": "turbo run lint",
    "db:generate": "turbo run db:generate",
    "db:migrate": "turbo run db:migrate",
    "db:migrate:local": "turbo run db:migrate:local",
    "db:migrate:remote": "turbo run db:migrate:remote",
    "db:seed": "turbo run db:seed",
    "db:studio": "turbo run db:studio",
    "deploy": "turbo run deploy"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

### Database Package Scripts

**packages/database/package.json**
```json
{
  "name": "@artisan-commerce/database",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:migrate:local": "tsx ../../scripts/migrate-local.ts",
    "db:migrate:remote": "wrangler d1 migrations apply artisan-commerce-prod --remote",
    "db:seed": "tsx ../../scripts/seed-local.ts",
    "db:studio": "drizzle-kit studio",
    "test": "vitest run",
    "test:unit": "vitest run --config vitest.config.unit.ts",
    "test:integration": "vitest run --config vitest.config.integration.ts",
    "test:watch": "vitest"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "@cloudflare/d1": "^1.0.0",
    "better-sqlite3": "^11.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "@types/better-sqlite3": "^7.6.0",
    "vitest": "^2.0.0",
    "tsx": "^4.0.0"
  }
}
```

### Web App Package Scripts

**apps/web/package.json**
```json
{
  "name": "@artisan-commerce/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "build": "vite build",
    "deploy": "wrangler deploy",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  },
  "dependencies": {
    "@artisan-commerce/database": "workspace:*"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "@playwright/test": "^1.40.0",
    "vite": "^5.0.0"
  }
}
```

---

## Testing Commands Summary

### Local Development

```bash
# Setup local database
npm run db:migrate:local
npm run db:seed

# Generate new migration
npm run db:generate

# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for TDD
cd packages/database && npm run test:watch

# Open Playwright UI
cd apps/web && npm run test:e2e:ui

# View test reports
cd apps/web && npm run test:e2e:report
```

### Production

```bash
# Deploy migrations to D1
npm run db:migrate:remote

# Deploy application
npm run deploy
```

---

## Best Practices

### 1. Migration Naming

- Use timestamps: `0000_20250103120530_add_users_table.sql`
- Descriptive names: `add_`, `drop_`, `alter_`, `create_index_`

### 2. Testing Isolation

- Use in-memory databases for integration tests
- Clean up after each test
- Use test fixtures for consistent data

### 3. Mock vs Real Database

| Test Type | Database | When to Use |
|-----------|----------|-------------|
| Unit | None (mocks) | Pure functions, business logic |
| Integration | In-memory SQLite | Repository tests, query tests |
| E2E | Local SQLite | Full application flow |

### 4. CI/CD Best Practices

- Run tests in parallel when possible
- Cache dependencies
- Run migrations in separate job
- Upload test artifacts
- Fail fast on lint/type errors

---

## Troubleshooting

### Common Issues

**Issue**: Migration fails in production
```bash
# Solution: Check migration status
npx wrangler d1 migrations list artisan-commerce-prod
```

**Issue**: Type errors with D1Database
```typescript
// Solution: Add proper type definitions
import type { D1Database } from '@cloudflare/workers-types';
```

**Issue**: Tests fail on CI but pass locally
```bash
# Solution: Ensure consistent Node version
# Add .nvmrc file
echo "20" > .nvmrc
```

---

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Summary

This guide provides a complete setup for:

✅ Drizzle ORM with Cloudflare D1 integration  
✅ Local development with better-sqlite3  
✅ Migration workflow (generate, apply, seed)  
✅ Comprehensive testing strategy (unit, integration, E2E)  
✅ Playwright E2E tests for SvelteKit + Workers  
✅ CI/CD pipeline with GitHub Actions  
✅ Monorepo package.json scripts

The setup supports both local development and production deployment, with clear separation of concerns and comprehensive testing at all levels.
