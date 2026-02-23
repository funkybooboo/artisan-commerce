# Getting Started with Implementation

**Last Updated**: 2024-07-23

This guide helps you start implementing Artisan Commerce after completing the comprehensive planning phase.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** installed
- **pnpm 8+** installed (`npm install -g pnpm`)
- **Git** installed and configured
- **GitHub account** with repository access
- **Cloudflare account** (free tier)
- **Code editor** (VS Code recommended)

---

## Phase 0: Repository Setup

### Step 1: Initialize Monorepo Structure

Run these commands to create the complete repository structure:

```bash
cd ~/projects/artisan-commerce

# Create directory structure
mkdir -p apps/web apps/workers
mkdir -p packages/adapters packages/database packages/types packages/ui
mkdir -p migrations
mkdir -p terraform/environments/{production,staging}
mkdir -p terraform/modules/{cloudflare-pages,cloudflare-workers,d1-database,r2-bucket,dns}
mkdir -p docs/developer/adapters
mkdir -p plans/decisions

# Create app subdirectories
mkdir -p apps/web/{app,components,lib,public,styles}
mkdir -p apps/web/app/{api,\(customer\),\(artisan\)}
mkdir -p apps/web/app/\(customer\)/{projects,patterns,cart,checkout,orders,messages,account,auth}
mkdir -p apps/web/app/\(artisan\)/artisan/{dashboard,orders,projects,patterns,customers,reviews,messages,discounts,settings,analytics}
mkdir -p apps/workers/src/{routes,middleware,services}

# Create package subdirectories
mkdir -p packages/adapters/src/{email,shipping,payment,tax,storage,auth,translation}
mkdir -p packages/database/src/{schema,repositories}
mkdir -p packages/types/src/{models,validation}
mkdir -p packages/ui/src/{components,lib,styles}
```

### Step 2: Initialize Package Files

Create root `package.json`:

```bash
cat > package.json << 'EOF'
{
  "name": "artisan-commerce",
  "version": "0.1.0",
  "private": true,
  "description": "Queue-based made-to-order artisan e-commerce platform",
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "build": "pnpm run --recursive --stream build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "pnpm run --recursive --parallel typecheck"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.8.3",
    "@playwright/test": "^1.45.0",
    "@types/node": "^20.14.10",
    "typescript": "^5.5.3",
    "vitest": "^2.0.2"
  }
}
EOF
```

Create `pnpm-workspace.yaml`:

```bash
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

Create root `tsconfig.json`:

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true,
    "paths": {
      "@artisan-commerce/adapters": ["./packages/adapters/src"],
      "@artisan-commerce/database": ["./packages/database/src"],
      "@artisan-commerce/types": ["./packages/types/src"],
      "@artisan-commerce/ui": ["./packages/ui/src"]
    }
  },
  "exclude": ["node_modules", "dist", ".next", ".wrangler"]
}
EOF
```

Create `biome.json`:

```bash
cat > biome.json << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
EOF
```

Create `vitest.config.ts`:

```bash
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85
      }
    }
  }
})
EOF
```

Create `playwright.config.ts`:

```bash
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
EOF
```

### Step 3: Initialize Git Flow Branches

```bash
# Ensure you're on main
git checkout main

# Create develop branch
git checkout -b develop
git push -u origin develop

# Set up branch protection (do this in GitHub UI):
# - main: require PR, require CI, require 1 approval, require signed commits
# - develop: require CI
```

### Step 4: Install Dependencies

```bash
pnpm install
```

### Step 5: Set Up Environment

```bash
cp .env.example .env
# Edit .env and fill in your values (start with mock adapters for local dev)
```

---

## Phase 1: Create Package Scaffolding

### Adapters Package

```bash
cd packages/adapters

cat > package.json << 'EOF'
{
  "name": "@artisan-commerce/adapters",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@artisan-commerce/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.3",
    "vitest": "^2.0.2"
  }
}
EOF

cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
EOF

# Create first adapter interface (EmailProvider)
cat > src/email/index.ts << 'EOF'
/**
 * Email provider interface for sending transactional and marketing emails.
 * 
 * All implementations must support:
 * - Transactional emails (order confirmations, shipping notifications)
 * - Template-based emails with variable substitution
 * - Bulk email sending for marketing campaigns
 */
export interface EmailProvider {
  sendTransactional(params: TransactionalEmailParams): Promise<EmailResult>
  sendTemplate(params: TemplateEmailParams): Promise<EmailResult>
  sendBulk(params: BulkEmailParams): Promise<EmailResult[]>
}

export interface TransactionalEmailParams {
  to: string | string[]
  from?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface TemplateEmailParams {
  to: string | string[]
  templateId: string
  variables: Record<string, unknown>
  from?: string
  replyTo?: string
}

export interface BulkEmailParams {
  recipients: Array<{ email: string; variables?: Record<string, unknown> }>
  templateId: string
  from?: string
}

export interface EmailResult {
  success: boolean
  messageId: string
  error?: string
}

export class EmailProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string
  ) {
    super(message)
    this.name = 'EmailProviderError'
  }
}
EOF

# Create mock implementation
cat > src/email/mock.provider.ts << 'EOF'
import { EmailProvider, TransactionalEmailParams, TemplateEmailParams, BulkEmailParams, EmailResult } from './index'

export class MockEmailProvider implements EmailProvider {
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    console.log('[MockEmailProvider] sendTransactional:', params)
    return { success: true, messageId: 'mock-transactional-id' }
  }

  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    console.log('[MockEmailProvider] sendTemplate:', params)
    return { success: true, messageId: 'mock-template-id' }
  }

  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    console.log('[MockEmailProvider] sendBulk:', params)
    return params.recipients.map((_, i) => ({
      success: true,
      messageId: `mock-bulk-${i}`
    }))
  }
}
EOF

# Create factory
cat > src/email/factory.ts << 'EOF'
import { EmailProvider } from './index'
import { MockEmailProvider } from './mock.provider'

export function createEmailProvider(env: any): EmailProvider {
  const provider = env.EMAIL_PROVIDER || 'mock'
  
  switch (provider) {
    case 'mock':
      return new MockEmailProvider()
    // TODO: Add Resend, Mailgun, etc.
    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}
EOF

# Create index
cat > src/index.ts << 'EOF'
export * from './email'
export * from './email/factory'
EOF

cd ../..
```

### Database Package

```bash
cd packages/database

cat > package.json << 'EOF'
{
  "name": "@artisan-commerce/database",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "wrangler d1 migrations apply",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@artisan-commerce/types": "workspace:*",
    "drizzle-orm": "^0.31.2"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240620.0",
    "drizzle-kit": "^0.22.7",
    "typescript": "^5.5.3"
  }
}
EOF

cat > drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/index.ts',
  out: '../../migrations',
  dialect: 'sqlite',
  driver: 'd1-http'
})
EOF

# Create first schema (tenants + users)
cat > src/schema/tenants.ts << 'EOF'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  subdomain: text('subdomain').notNull().unique(),
  customDomain: text('custom_domain'),
  name: text('name').notNull(),
  plan: text('plan').notNull(), // free, starter, pro
  status: text('status').notNull(), // active, suspended, cancelled
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})
EOF

cat > src/schema/users.ts << 'EOF'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { tenants } from './tenants'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role').notNull(), // customer, artisan, super_admin
  defaultAddress: text('default_address'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' })
})
EOF

cat > src/schema/index.ts << 'EOF'
export * from './tenants'
export * from './users'
EOF

# Create first repository interface
cat > src/repositories/user.repository.ts << 'EOF'
export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserData): Promise<User>
  update(id: string, data: UpdateUserData): Promise<User>
  delete(id: string): Promise<void>
}

export interface User {
  id: string
  tenantId: string
  email: string
  name: string
  phone?: string
  role: 'customer' | 'artisan' | 'super_admin'
  defaultAddress?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface CreateUserData {
  email: string
  name: string
  phone?: string
  role: 'customer' | 'artisan' | 'super_admin'
  defaultAddress?: string
}

export interface UpdateUserData {
  name?: string
  phone?: string
  defaultAddress?: string
}
EOF

cat > src/index.ts << 'EOF'
export * from './schema'
export * from './repositories/user.repository'
EOF

cd ../..
```

### Types Package

```bash
cd packages/types

cat > package.json << 'EOF'
{
  "name": "@artisan-commerce/types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.3"
  }
}
EOF

# Create first Zod schema
cat > src/validation/auth.schema.ts << 'EOF'
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters')
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
EOF

cat > src/index.ts << 'EOF'
export * from './validation/auth.schema'
EOF

cd ../..
```

### UI Package

```bash
cd packages/ui

cat > package.json << 'EOF'
{
  "name": "@artisan-commerce/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0"
  },
  "peerDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.3"
  }
}
EOF

# Create utility function
cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

cat > src/index.ts << 'EOF'
export * from './lib/utils'
EOF

cd ../..
```

---

## Phase 2: Initialize Apps

### Next.js App

```bash
cd apps/web

cat > package.json << 'EOF'
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@artisan-commerce/adapters": "workspace:*",
    "@artisan-commerce/database": "workspace:*",
    "@artisan-commerce/types": "workspace:*",
    "@artisan-commerce/ui": "workspace:*",
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.52.1",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@cloudflare/next-on-pages": "^1.13.0",
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3"
  }
}
EOF

cat > next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@artisan-commerce/database']
  }
}

export default nextConfig
EOF

cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}

export default config
EOF

cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create root layout
cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Artisan Commerce',
  description: 'Transparent, capacity-managed made-to-order artisan crafts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF

# Create homepage
cat > app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Artisan Commerce</h1>
      <p className="mt-4 text-xl text-gray-600">
        Transparent, capacity-managed made-to-order artisan crafts
      </p>
    </main>
  )
}
EOF

# Create global styles
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

cd ../..
```

### Hono Workers API

```bash
cd apps/workers

cat > package.json << 'EOF'
{
  "name": "workers",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@artisan-commerce/adapters": "workspace:*",
    "@artisan-commerce/database": "workspace:*",
    "@artisan-commerce/types": "workspace:*",
    "hono": "^4.4.13",
    "@hono/zod-validator": "^0.2.2",
    "drizzle-orm": "^0.31.2",
    "jose": "^5.6.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240620.0",
    "typescript": "^5.5.3",
    "wrangler": "^3.64.0"
  }
}
EOF

cat > wrangler.toml << 'EOF'
name = "artisan-commerce-api"
main = "src/index.ts"
compatibility_date = "2024-07-01"

# Secrets (set via: wrangler secret put SECRET_NAME)
# JWT_SECRET
# RESEND_API_KEY
# SHIPPO_API_KEY
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
EOF

# Create entry point
cat > src/index.ts << 'EOF'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => {
  return c.json({ message: 'Artisan Commerce API' })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

export default app
EOF

cd ../..
```

---

## Phase 3: Verify Setup

```bash
# Install all dependencies
pnpm install

# Run type checking
pnpm run typecheck

# Run linting
pnpm run lint

# Start development servers (in separate terminals)
cd apps/web && pnpm run dev
cd apps/workers && pnpm run dev

# Visit http://localhost:3000 (Next.js)
# Visit http://localhost:8787 (Hono API)
```

---

## Next Steps

You're now ready to start TDD implementation! Follow this order:

1. **v0.2.0 - Authentication**
   - Write failing test for user registration
   - Implement User model and repository
   - Implement magic link generation
   - Implement email sending
   - Make tests pass

2. **v0.3.0 - Projects & Patterns**
   - Write failing tests for project CRUD
   - Implement Project model and repository
   - Implement file upload
   - Make tests pass

3. **Continue through roadmap milestones**

---

## Useful Commands

```bash
# Development
pnpm run dev                 # Start all services
pnpm run build               # Build all packages
pnpm run typecheck           # Type check all packages
pnpm run lint                # Lint all packages
pnpm run format              # Format all packages

# Testing
pnpm run test                # Run unit tests
pnpm run test:watch          # Run tests in watch mode
pnpm run test:e2e            # Run E2E tests

# Database
cd packages/database
pnpm run db:generate         # Generate migrations
pnpm run db:migrate          # Apply migrations
pnpm run db:studio           # Open Drizzle Studio

# Deployment
cd apps/web
npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static

cd apps/workers
wrangler deploy
```

---

## Troubleshooting

**Issue**: `pnpm install` fails
**Solution**: Ensure Node.js 20+ and pnpm 8+ are installed

**Issue**: Type errors in packages
**Solution**: Run `pnpm run typecheck` to see detailed errors

**Issue**: Next.js won't start
**Solution**: Check port 3000 is not in use, delete `.next` folder and rebuild

**Issue**: Workers won't start
**Solution**: Check port 8787 is not in use, ensure wrangler.toml is correct

---

## Resources

- [Comprehensive Roadmap](../plans/ROADMAP-COMPREHENSIVE.md)
- [ADR-005: Adapter Architecture](../plans/decisions/ADR-005-adapter-architecture.md)
- [ADR-006: Next.js App Router](../plans/decisions/ADR-006-nextjs-app-router.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
