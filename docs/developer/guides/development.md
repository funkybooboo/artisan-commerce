# Development Guide

Comprehensive guide for local development, testing, and debugging.

**Quick start?** See [Getting Started](./getting-started.md) for 5-minute setup.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Database](#database)
6. [Debugging](#debugging)
7. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

**Core Tools:**
- **[mise](https://mise.jdx.dev/getting-started.html)** - Task runner and environment manager
- **Git** - Version control

**Automatically Installed:**
- Node.js 20 (via mise)
- npm (comes with Node.js)
- Wrangler CLI (via `mise run setup`)
- Playwright (via `mise run setup`)

**Recommended Editor:**
- VS Code with extensions:
  - Svelte for VS Code
  - Tailwind CSS IntelliSense
  - Biome (linter/formatter)

### Accounts Needed

**For Local Development:**
- **GitHub** - Repository access
- **Cloudflare** (free tier) - For deploying to staging/production
- **Stripe** (test mode) - Payment processing testing
- **Resend** (free tier) - Email notifications testing

**Optional:**
- **Terraform Cloud** (free tier) - Remote state management (only if managing infrastructure)

### System Requirements

- **OS**: macOS, Linux, or Windows (WSL2)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB for dependencies
- **Internet**: Required for Cloudflare Workers local development

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/funkybooboo/artisan-commerce.git
cd artisan-commerce
```

### 2. Install Dependencies

```bash
mise run setup
```

This installs:
- Node.js 20
- Root project dependencies
- Worker dependencies
- Development tools

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Required for local development
NODE_ENV=development
APP_BASE_URL=http://localhost:5173

# Stripe (use test mode keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (for email testing)
RESEND_API_KEY=re_...

# Cloudflare (for local Wrangler)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

### 4. Initialize Database

```bash
cd workers/api
npm run migrate:local
npm run seed:local  # Optional: add test data
```

### 5. Verify Setup

```bash
mise run dev
```

Visit:
- Frontend: http://localhost:5173
- API: http://localhost:8787

---

## Development Workflow

### Starting Development Servers

**Both servers (recommended):**
```bash
mise run dev
```

**Separately:**
```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:worker
```

### Making Changes

#### Frontend (SvelteKit)

1. Edit files in `src/`
2. Hot reload updates browser automatically
3. Check http://localhost:5173

**Example: Add new page**
```bash
mkdir -p src/routes/about
touch src/routes/about/+page.svelte
```

```svelte
<!-- src/routes/about/+page.svelte -->
<script lang="ts">
  // TypeScript logic
</script>

<h1>About Artisan Commerce</h1>
<p>Transparent marketplace for handmade crafts.</p>
```

#### Backend (Workers)

1. Edit files in `workers/api/src/`
2. Wrangler auto-reloads
3. Test at http://localhost:8787

**Example: Add API endpoint**
```typescript
// workers/api/src/routes/health.ts
export async function handleHealth(request: Request, env: Env): Promise<Response> {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: await checkDatabase(env),
  });
}
```

#### Database Changes

1. Create migration:
```bash
cd workers/api
wrangler d1 migrations create artisan-db add_reviews_table
```

2. Edit generated migration:
```sql
-- migrations/0003_add_reviews_table.sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

3. Apply locally:
```bash
npm run migrate:local
```

---

## Testing

### Test-Driven Development (TDD)

Follow the **Red → Green → Refactor** cycle:

1. **Red**: Write failing test
2. **Green**: Write minimum code to pass
3. **Refactor**: Improve code quality

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode (re-runs on changes)
npm run test:watch

# With coverage
npm run test:coverage
```

### Writing Tests

#### Unit Test Example

```typescript
// workers/api/test/unit/queue.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDeliveryEstimate } from '../../src/lib/queue';

describe('Queue calculations', () => {
  it('calculates delivery estimate correctly', () => {
    const queueState = {
      currentLoad: 40,
      weeklyCapacity: 10,
    };
    const newOrder = {
      queueWeight: 5,
      productionTimeWeeks: 4,
    };
    
    const estimate = calculateDeliveryEstimate(queueState, newOrder);
    
    // (40 + 5) / 10 = 4.5 weeks queue + 4 weeks production = 8.5 weeks
    expect(estimate.weeks).toBe(8.5);
  });
});
```

#### E2E Test Example

```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete checkout', async ({ page }) => {
  await page.goto('/projects/1');
  
  // Select options
  await page.selectOption('[name="material"]', 'wool');
  await page.selectOption('[name="color"]', 'blue');
  
  // Add to cart
  await page.click('button:has-text("Add to Cart")');
  
  // Verify cart
  await expect(page.locator('.cart-count')).toHaveText('1');
  
  // Go to checkout
  await page.goto('/checkout');
  
  // Fill in test card
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="expiry"]', '12/34');
  await page.fill('[name="cvc"]', '123');
  
  // Submit order
  await page.click('button:has-text("Place Order")');
  
  // Verify success
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

### Test Coverage

Target: **85%+ coverage**

Check coverage:
```bash
npm run test:coverage
```

---

## Database

### Viewing Local Database

```bash
# Using Wrangler
wrangler d1 execute artisan-db --local --command "SELECT * FROM users"

# Using SQLite CLI (if installed)
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxx.sqlite
```

### Resetting Database

```bash
# Delete local database
rm -rf .wrangler/state/v3/d1/

# Re-run migrations
npm run migrate:local

# Re-seed data
npm run seed:local
```

### Inspecting Schema

```bash
wrangler d1 execute artisan-db --local --command ".schema"
```

---

## Debugging

### Frontend Debugging

1. **Browser DevTools**: F12 in Chrome/Firefox
2. **Svelte DevTools**: Install browser extension
3. **Console Logs**: Use `console.log()` in `.svelte` files

### Worker Debugging

1. **Console Logs**: Use `console.log()` in Worker code (shown in terminal)
2. **Breakpoints**: Use `debugger;` statement
3. **Wrangler Logs**: Automatically shown in terminal

Example:
```typescript
export async function handleOrders(request: Request, env: Env) {
  console.log('Received order request:', request.method);
  
  const body = await request.json();
  console.log('Order data:', body);
  
  // Your logic here
}
```

### Testing Stripe Webhooks Locally

Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS

# Login
stripe login

# Forward webhooks to local Worker
stripe listen --forward-to http://localhost:8787/api/webhooks/stripe
```

---

## Common Issues

### Port Already in Use

```bash
# Error: Port 5173 is already in use

# Find process
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use different port
PORT=3000 npm run dev:frontend
```

### Database Migration Errors

```bash
# Check migration status
wrangler d1 migrations list artisan-db --local

# If stuck, reset database (see Database section)
```

### Worker Not Updating

```bash
# Restart Wrangler dev server
# Ctrl+C to stop, then:
npm run dev:worker
```

### Environment Variable Errors

```bash
# Ensure .env exists
ls -la .env

# Verify required variables are set
cat .env | grep -E "STRIPE|RESEND|CLOUDFLARE"
```

---

## Useful Commands Reference

### mise Commands

```bash
mise run setup               # Install dependencies
mise run dev                 # Start all dev servers
mise run test                # Run all tests
mise run lint                # Run linter
mise run format              # Format code
mise run build               # Build for production
mise run validate            # Run all checks
mise tasks ls                # Show all tasks
```

### npm Commands

```bash
# Development
npm run dev                  # Start all servers
npm run dev:frontend         # SvelteKit only
npm run dev:worker           # Worker only

# Testing
npm test                     # All tests
npm run test:unit            # Unit tests
npm run test:integration     # Integration tests
npm run test:e2e             # E2E tests
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage

# Code Quality
npm run lint                 # Run linter
npm run format               # Format code
npm run check                # Type check

# Database
npm run migrate:local        # Apply migrations
npm run seed:local           # Seed test data

# Build
npm run build                # Build for production
npm run preview              # Preview production build
```

---

## Next Steps

- Review [Code Standards](../standards/code-standards.md) before writing code
- Understand [Testing Philosophy](../standards/testing.md)
- Learn [Git Workflow](../standards/git-workflow.md) for commits and PRs
- Check [Architecture](../reference/architecture.md) for system design
- See [Roadmap](../../plans/roadmap.md) for what we're building
