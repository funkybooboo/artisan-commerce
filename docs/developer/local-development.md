# Local Development Guide

This guide covers setting up your local development environment for Bluebells & Thistles.

## Prerequisites

### Required Software

**Core Tools:**
- **[mise](https://mise.jdx.dev/getting-started.html)**: Task runner and environment manager
  - Automatically installs Node.js and manages versions
  - Provides consistent commands across the team
  - Install: `curl https://mise.run | sh` (or see [mise docs](https://mise.jdx.dev/getting-started.html))
- **Git**: Version control ([download](https://git-scm.com/))

**Automatically Installed by mise:**
- **Node.js 20**: Installed automatically when you run `mise run setup`
- **npm**: Comes with Node.js

**Code Editor (Recommended):**
- **VS Code** with these extensions:
  - Svelte for VS Code
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint
  - Biome (optional, if using Biome instead of ESLint/Prettier)

### Recommended Tools

**Development Tools (installed via npm):**
- **Wrangler CLI**: Cloudflare's development tool (installed via `mise run setup`)
- **Playwright**: For E2E testing (installed via `mise run setup`)

**Infrastructure Tools (optional for local dev):**
- **Terraform**: For infrastructure management
  - Only needed if you're deploying infrastructure
  - Install: [Terraform Downloads](https://www.terraform.io/downloads)
  - Not required for local development

### Accounts Needed

**For Local Development:**
- **GitHub account**: For repository access and CI/CD
- **Cloudflare account** (free tier): 
  - Sign up: https://dash.cloudflare.com/sign-up
  - Needed for: Deploying to staging/production, accessing D1/R2/Workers
- **Stripe account** (test mode):
  - Sign up: https://dashboard.stripe.com/register
  - Use test mode keys for local development
  - Needed for: Payment processing testing
- **Resend account** (free tier):
  - Sign up: https://resend.com/signup
  - Free tier: 3000 emails/month
  - Needed for: Email notifications testing

**Optional Accounts:**
- **Terraform Cloud** (free tier): For remote state management
  - Only needed if managing infrastructure
  - Sign up: https://app.terraform.io/signup

### System Requirements

**Minimum:**
- **OS**: macOS, Linux, or Windows (WSL2 recommended for Windows)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB for dependencies and local database
- **Internet**: Required for Cloudflare Workers local development

**Supported Platforms:**
- macOS (Intel or Apple Silicon)
- Linux (Ubuntu 20.04+, Debian, Fedora, Arch)
- Windows 10/11 with WSL2 (Ubuntu recommended)

### Verification

After installing prerequisites, verify your setup:

```bash
# Check mise
mise --version
# Should show: mise 2024.x.x or higher

# Check Git
git --version
# Should show: git version 2.x.x or higher

# Node.js will be installed by mise
# After running 'mise run setup', verify:
node --version
# Should show: v20.x.x

npm --version
# Should show: 10.x.x or higher
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/funkybooboo/bluebellsandthistles.git
cd bluebellsandthistles
```

### 2. Install Dependencies

```bash
# mise automatically installs Node.js 20 and all dependencies
mise run setup
```

This command:
- Installs Node.js 20 (if not already installed)
- Installs root project dependencies
- Installs Worker dependencies
- Sets up the development environment

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your local values:

```bash
# .env (local development)

# App Configuration
NODE_ENV=development
APP_BASE_URL=http://localhost:5173

# Stripe (use test mode keys)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Resend (for email testing)
RESEND_API_KEY=re_your_api_key_here

# Cloudflare (for local Wrangler)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

**Note**: Never commit `.env` to Git. It's in `.gitignore` by default.

### 4. Initialize Local Database

Wrangler automatically creates a local SQLite database when you run the dev server:

```bash
cd workers/api
npm run dev
```

This creates `.wrangler/state/v3/d1/` with your local database.

### 5. Run Database Migrations

Apply the initial schema to your local database:

```bash
# From workers/api directory
npm run migrate:local

# Or using wrangler directly
wrangler d1 migrations apply bluebells-db --local
```

### 6. Seed Local Database (Optional)

Add test data for development:

```bash
npm run seed:local
```

This creates:
- Test users (admin, regular user)
- Sample projects (sweaters, blankets, etc.)
- Sample patterns
- Test orders in various states

## Development Workflow

### Starting the Development Servers

Run both frontend and backend simultaneously:

```bash
# From project root (recommended)
mise run dev
```

This starts:
- **SvelteKit dev server**: http://localhost:5173 (frontend)
- **Cloudflare Worker**: http://localhost:8787 (API)
- **Local D1 database**: SQLite file in `.wrangler/state/`

Or run them separately:

```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:worker
```

**Using mise vs npm:**
- `mise run dev` - Recommended (uses mise task runner)
- `npm run dev` - Also works (direct npm script)

### Project Structure

```
bluebellsandthistles/
├── src/                      # SvelteKit frontend
│   ├── routes/              # Pages and API routes
│   │   ├── +page.svelte    # Homepage
│   │   ├── projects/       # Projects pages
│   │   ├── admin/          # Admin dashboard
│   │   └── api/            # Frontend API routes (if needed)
│   ├── lib/
│   │   ├── components/     # Reusable Svelte components
│   │   ├── api/            # API client (calls Workers)
│   │   └── stores/         # Svelte stores
│   └── app.html            # HTML template
│
├── workers/
│   ├── api/                # Main API Worker
│   │   ├── src/
│   │   │   ├── index.ts   # Worker entrypoint
│   │   │   ├── routes/    # API route handlers
│   │   │   └── lib/       # Shared utilities
│   │   ├── test/          # Worker tests
│   │   └── wrangler.toml  # Worker configuration
│   └── stripe-webhook/    # Stripe webhook handler
│
├── migrations/             # Database migrations
│   ├── 0001_initial.sql
│   └── 0002_add_patterns.sql
│
├── terraform/              # Infrastructure as Code
│   ├── environments/
│   │   ├── staging/
│   │   └── production/
│   └── modules/
│
└── scripts/               # Utility scripts
    ├── seed-data.sh
    └── backup.sh
```

### Making Changes

#### Frontend Changes (SvelteKit)

1. Edit files in `src/`
2. Hot reload automatically updates the browser
3. Check http://localhost:5173

Example: Add a new page

```bash
# Create new route
mkdir -p src/routes/about
touch src/routes/about/+page.svelte
```

```svelte
<!-- src/routes/about/+page.svelte -->
<script lang="ts">
  // TypeScript logic here
</script>

<h1>About Bluebells & Thistles</h1>
<p>A transparent marketplace for handmade crafts.</p>
```

#### Backend Changes (Workers)

1. Edit files in `workers/api/src/`
2. Wrangler automatically reloads
3. Test at http://localhost:8787

Example: Add a new API endpoint

```typescript
// workers/api/src/routes/health.ts
export async function handleHealth(request: Request, env: Env): Promise<Response> {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: await checkDatabase(env),
  });
}

async function checkDatabase(env: Env): Promise<string> {
  try {
    await env.DB.prepare('SELECT 1').first();
    return 'connected';
  } catch (error) {
    return 'error';
  }
}
```

```typescript
// workers/api/src/index.ts
import { handleHealth } from './routes/health';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/health') {
      return handleHealth(request, env);
    }
    
    // ... other routes
  }
};
```

#### Database Changes

1. Create a new migration file:

```bash
cd workers/api
wrangler d1 migrations create bluebells-db add_reviews_table
```

2. Edit the generated migration file:

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

CREATE INDEX idx_reviews_order ON reviews(order_id);
```

3. Apply to local database:

```bash
npm run migrate:local
```

4. Test your changes with the new schema

### Testing

#### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage
npm run test:coverage
```

Example unit test:

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

#### Integration Tests

```bash
# Run integration tests (uses local Worker)
npm run test:integration
```

#### E2E Tests

```bash
# Run end-to-end tests with Playwright
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test checkout.spec.ts
```

Example E2E test:

```typescript
// src/tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete checkout', async ({ page }) => {
  // Navigate to project
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
  
  // Fill in test card (Stripe test mode)
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

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Type Checking

```bash
# Check TypeScript types
npm run check

# Watch mode (re-checks on file changes)
npm run check:watch
```

## Working with the Database

### Viewing Local Database

The local D1 database is a SQLite file. You can query it directly:

```bash
# Using Wrangler
wrangler d1 execute bluebells-db --local --command "SELECT * FROM users"

# Or use SQLite CLI (if installed)
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxx.sqlite
```

### Resetting Local Database

```bash
# Delete local database
rm -rf .wrangler/state/v3/d1/

# Re-run migrations
npm run migrate:local

# Re-seed data
npm run seed:local
```

### Inspecting Database Schema

```bash
wrangler d1 execute bluebells-db --local --command ".schema"
```

## Debugging

### Frontend Debugging

1. **Browser DevTools**: Open Chrome/Firefox DevTools (F12)
2. **Svelte DevTools**: Install browser extension for Svelte-specific debugging
3. **Console Logs**: Use `console.log()` in `.svelte` files

### Worker Debugging

1. **Console Logs**: Use `console.log()` in Worker code
2. **Wrangler Logs**: Automatically shown in terminal
3. **Breakpoints**: Use `debugger;` statement (works in Wrangler dev mode)

Example:

```typescript
export async function handleOrders(request: Request, env: Env) {
  console.log('Received order request:', request.method);
  
  const body = await request.json();
  console.log('Order data:', body);
  
  // Your logic here
}
```

### Common Issues

#### Port Already in Use

```bash
# Error: Port 5173 is already in use
# Solution: Kill the process or use a different port

# Find process using port
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use different port
PORT=3000 npm run dev:frontend
```

#### Database Migration Errors

```bash
# Error: Migration already applied
# Solution: Check migration status

wrangler d1 migrations list bluebells-db --local

# If stuck, reset database (see above)
```

#### Worker Not Updating

```bash
# Solution: Restart Wrangler dev server
# Ctrl+C to stop, then npm run dev:worker again
```

## Environment-Specific Testing

### Testing Against Staging

```bash
# Point frontend to staging API
VITE_API_URL=https://staging.bluebellsandthistles.com npm run dev:frontend
```

### Testing Stripe Webhooks Locally

Use Stripe CLI to forward webhooks to your local Worker:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local Worker
stripe listen --forward-to http://localhost:8787/api/webhooks/stripe
```

## Performance Profiling

### Frontend Performance

```bash
# Build for production and analyze bundle size
npm run build
npm run analyze
```

### Worker Performance

Use Wrangler's built-in profiling:

```bash
# Run Worker with profiling
wrangler dev --local --log-level debug
```

## Next Steps

- Read [deployment.md](./deployment.md) for deploying to staging/production
- See [Testing Guide](./05-testing.md) for comprehensive testing strategies
- Check [Architecture](./03-architecture.md) for system design principles
- Review [Code Standards](./04-code-standards.md) for coding conventions

## Getting Help

- **Documentation**: Check `docs/` directory
- **ADRs**: See `plans/decisions/` for architectural decisions
- **Issues**: Open a GitHub issue for bugs or questions
- **Discussions**: Use GitHub Discussions for general questions

## Useful Commands Reference

### mise Commands (Recommended)

```bash
# Setup
mise run setup               # Install dependencies and setup environment
mise tasks ls                # Show all available mise tasks

# Development
mise run dev                 # Start all dev servers
mise run test                # Run all tests
mise run lint                # Run linter
mise run format              # Format code
mise run build               # Build for production

# Validation
mise run validate            # Run all checks (format, lint, type-check, test, build)
```

### npm Commands (Direct)

```bash
# Development
npm run dev                  # Start all dev servers
npm run dev:frontend         # Start SvelteKit only
npm run dev:worker           # Start Worker only

# Testing
npm test                     # Run all tests
npm run test:unit            # Unit tests
npm run test:integration     # Integration tests
npm run test:e2e             # E2E tests
npm run test:watch           # Watch mode

# Code Quality
npm run lint                 # Run linter
npm run format               # Format code
npm run check                # Type check

# Database
npm run migrate:local        # Apply migrations locally
npm run seed:local           # Seed test data
wrangler d1 execute ...      # Query database

# Build
npm run build                # Build for production
npm run preview              # Preview production build
```

**Note**: Use `mise run <task>` for consistency across the team. Direct `npm` commands also work.
