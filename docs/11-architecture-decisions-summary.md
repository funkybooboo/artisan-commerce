# 11. Architecture Decisions Summary

**Last Updated**: 2026-02-23

This document provides a quick reference for all major architectural decisions made during the planning phase. For detailed rationale, see the individual ADRs in [`plans/decisions/`](../plans/decisions/).

---

## Core Architectural Principles

### Single-Tenant-Per-Instance
- **Decision**: One artisan business per application instance
- **Rationale**: Simplicity, no runtime multi-tenancy complexity
- **Implementation**: Brand configuration via environment variables
- **Scaling**: Fork repository and deploy separate instances for new artisan businesses
- **Database**: No tenant_id columns needed - simple schema

### Two User Roles Only
- **Customer**: Buyers who place orders
- **Artisan**: Business owner with full admin access
- **No super_admin**: Engineer manages infrastructure via CLI/Terraform, not web UI

### Zero Vendor Lock-In
- **Decision**: Comprehensive adapter pattern for ALL external services
- **Covered Services**: Email, shipping, payment, tax, storage, auth, translation
- **Naming Convention**: `EmailProvider` (interface), `ResendEmailProvider` (implementation)
- **Test Doubles**: Mock, InMemory, Recording, Stub for each adapter
- **Factory Pattern**: Environment variable selects implementation at runtime

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 App Router
- **Why**: Maximum LLM support (95% code accuracy), huge ecosystem, excellent Cloudflare compatibility
- **Styling**: Tailwind CSS + shadcn/ui (copy-paste components, no dependency)
- **Forms**: React Hook Form + Zod (type-safe validation)
- **State**: Server Components + URL state (Zustand if needed for complex client state)
- **Deployment**: Cloudflare Pages

### Backend
- **Framework**: Hono on Cloudflare Workers
- **Why**: Lightweight, fast, edge-optimized, Express-like API (LLM-friendly)
- **Database**: Drizzle ORM + Cloudflare D1 (SQLite-as-a-service)
- **Authentication**: Custom JWT + Magic Links (passwordless)
- **File Storage**: Cloudflare R2 (S3-compatible)

### Development Tools
- **Runtime**: Node.js everywhere (dev/CI/prod parity, NOT Bun)
- **Monorepo**: pnpm workspaces
- **Testing**: TDD with Vitest + Playwright (85%+ coverage target)
- **Linting**: Biome (replaces ESLint + Prettier)
- **CI/CD**: GitHub Actions with SLSA Level 3 provenance
- **Git**: Git Flow (main/develop/feature/release branches)

### Infrastructure
- **IaC**: Terraform provisions resources, Wrangler deploys code
- **Hosting**: Cloudflare (Pages + Workers + D1 + R2)
- **Monitoring**: Cloudflare Dashboard (manual initially)
- **Cost**: ~$1-5/month (domain + transaction fees, everything else free tier)

---

## Business Rules

### Queue System (Core Differentiator)
- **5-tier weight system**: XSmall=1, Small=2, Medium=4, Large=6, XLarge=8
- **FIFO by default**: Artisan can manually reorder via drag-and-drop kanban
- **Capacity**: Simple weekly capacity number + pause button
- **Estimates**: Dynamic delivery calculation based on queue position
- **Waitlist**: Email signup when capacity full, notify when opens

### Order Management
- **8 lifecycle states**: pending_payment → paid → in_queue → in_production → shipped → delivered + cancelled + refunded
- **12-hour free modification window**: Configurable, per-order override possible
- **$15 flat cancellation fee**: After 12 hours
- **In-production cancellations**: Case-by-case artisan approval
- **Multi-item orders**: Ship together with single tracking number
- **Custom sizing**: Text field for measurements

### Pricing
- **Simple additive modifiers**: base_price + material_modifier + size_modifier + custom_text_modifier
- **No complex pricing**: Avoid percentage-based or conditional pricing initially
- **Option dependencies**: Artisan can define conditional logic (e.g., if material=wool, only show certain colors)

### Payment
- **Full upfront payment**: Via Stripe Checkout (hosted, zero PCI burden)
- **Discount codes**: One-time use, % or $ off, artisan creates
- **Tax**: Automatic via Stripe Tax (0.5% of tax collected)
- **Refunds**: Full/partial with reason tracking

### Shipping
- **USPS only** (v1.0): Calculated rates + integrated labels via Shippo ($0.05/label)
- **Worldwide shipping**: Supported from v1.0
- **Tracking**: Automatic tracking number assignment

### Reviews
- **After delivery only**: Verified buyers
- **Content**: Star rating (1-5) + text comment + delivery accuracy (yes/no)
- **No customer photos**: Keep it simple
- **Artisan moderation**: Can hide reviews (with reason) and respond publicly

### Messages
- **Order messages**: Threaded chat on order detail page
- **Contact form**: General messages (no order required)
- **Unified inbox**: Customer sees all messages in one place

### Favorites
- **Bookmark projects**: For later purchase
- **Shareable wishlist**: Public URL
- **Notifications**: When favorited project delivery time shortens or capacity opens

---

## Domain Model

### Core Entities

**User**
- Roles: customer, artisan
- Fields: email, name, phone (optional), role, default_address (JSON), email_preferences
- Authentication: Passwordless magic links (JWT with 24hr expiry)

**Project** (Made-to-Order Handmade Items)
- Types: crochet, knitting, embroidery, cross_stitch, sewn
- Fields: name, description, base_price, production_time_weeks, queue_tier
- Options: material, color, size, custom_text (with dependencies)
- Multiple images with display order
- Pattern link (optional bidirectional)

**Pattern** (Digital/Physical Products)
- Fields: name, description, difficulty, price
- File: PDF stored in R2, preview images
- Bidirectional link to projects

**Order**
- Fields: customer, status, subtotal, tax, shipping, discount, total
- Shipping address (JSON snapshot at time of order)
- Queue position, estimated_delivery_date
- Modification window (12hr default, configurable)
- Payment intent ID (Stripe)

**Order Items**
- Fields: order, item_type (project/pattern/merch), item_id, quantity, unit_price (snapshot)
- Selected options (JSON: material, color, size, custom_measurements)
- Tax rate, tax amount, subtotal

**Queue**
- Queue entries: order_id, position, weight, entered_at, estimated_completion_at
- Queue config: weekly_capacity, is_paused, paused_reason

**Merch** (Inventory-Based Products)
- Fields: name, description, price, stock_quantity, low_stock_threshold
- Separate from handmade queue

**Review**
- Fields: customer, project, order, rating (1-5), comment, delivery_on_time (boolean)
- Status: visible/hidden, hidden_reason, hidden_by, hidden_at

**Review Responses**
- Fields: review, artisan, response_text, created_at

**Messages**
- Types: order or contact
- Fields: order (nullable), sender, sender_type, message, created_at

**Favorites**
- Fields: customer, project, created_at, notified_at

**Discount Codes**
- Fields: code, type (percent/fixed), value, usage_limit (1), expires_at
- One-time use only

**Shipping Labels**
- Fields: order, label_url, tracking_number, carrier (usps), service, cost

**Email Preferences**
- Types: order_confirmation, order_shipped, queue_position_changed, queue_capacity_opened, low_stock_alert, marketing
- Granular per-event control

---

## Development Workflow

### TDD Approach (Red → Green → Refactor)
1. Write failing test (RED)
2. Implement minimum code to pass (GREEN)
3. Refactor for quality
4. Run full test suite before finishing

### Test Coverage
- **Target**: 85%+ coverage
- **Unit tests**: Alongside code (`foo.test.ts`, `test_foo.py`, `foo_test.rs`)
- **Integration tests**: `tests/` directory
- **E2E tests**: `e2e/` or `tests/e2e/` or `playwright/`
- **Full E2E every PR**: Comprehensive Playwright tests on every pull request

### Git Flow
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/***: Feature branches
- **release/***: Release branches
- **Commits**: Conventional commits (`type(scope): description`)

### CI/CD
- **GitHub Actions**: Run tests, linting, type checking on every PR
- **SLSA Level 3**: Supply chain security with provenance
- **Dependabot**: Automatic security updates

---

## Security

### Multi-Layered Approach
1. **Geographic restriction**: Utah IP for artisan access (configurable)
2. **Role-based access**: Customer vs Artisan permissions
3. **Rate limiting**: Sensitive operations (login, checkout, etc.)
4. **WCAG 2.1 AA**: Accessibility compliance
5. **SLSA Level 3**: Supply chain security

### Authentication
- **Passwordless**: Magic links via email (15min expiry)
- **JWT sessions**: 24-hour expiry, httpOnly cookies
- **No passwords**: Eliminates password-related vulnerabilities

---

## Cost Optimization

### Target: $1-5/month
- **Cloudflare Pages**: Free tier (unlimited requests)
- **Cloudflare Workers**: Free tier (100k requests/day)
- **Cloudflare D1**: Free tier (5GB storage, 5M reads/day)
- **Cloudflare R2**: Free tier (10GB storage, 10GB egress/month)
- **Resend**: Free tier (3000 emails/month)
- **Stripe**: 2.9% + 30¢ per transaction (only cost when making money)
- **Shippo**: $0.05 per label (only cost when shipping)
- **Stripe Tax**: 0.5% of tax collected (only cost on taxable sales)
- **Domain**: ~$12/year (~$1/month)

### Scaling Strategy
- Free tiers cover 100x expected initial usage
- Transaction-based pricing aligns costs with revenue
- Evaluate ROI for every paid service
- Stay on free tiers as long as possible

---

## Portability Strategy

### Database Migration Path
- **Current**: Cloudflare D1 (SQLite)
- **Future**: Postgres, MySQL, or any SQL database
- **How**: Drizzle ORM supports multiple databases, repository pattern abstracts queries

### Framework Portability
- **Next.js**: Can deploy to Vercel, Netlify, AWS, self-hosted
- **Hono**: Can run on any JavaScript runtime (Node, Deno, Bun, Cloudflare Workers)

### Adapter Pattern
- **All external services wrapped**: Email, shipping, payment, tax, storage, auth, translation
- **Easy swapping**: Change environment variable to switch providers
- **No vendor lock-in**: Can migrate away from any service without code changes

---

## Timeline & Milestones

### v0.1.0 - Foundation (1-2 weeks)
- Monorepo structure, CI/CD, development environment setup
- **Done when**: `pnpm install && pnpm run dev` works

### v0.2.0 - Authentication (2-3 weeks)
- User registration, magic links, JWT sessions, role-based access
- **Done when**: Customers can register and log in

### v0.3.0 - Projects & Patterns (3-4 weeks)
- Project/pattern CRUD, options system, favorites
- **Done when**: Artisan can create projects, customers can browse

### v0.4.0 - Queue System (3-4 weeks)
- Queue calculation, capacity management, delivery estimates
- **Done when**: Queue accurately calculates delivery estimates

### v0.5.0 - Shopping Cart & Orders (3-4 weeks)
- Cart, order creation, order lifecycle, modification windows
- **Done when**: Customers can place orders (no payment yet)

### v0.6.0 - Payment Integration (2-3 weeks)
- Stripe checkout, webhooks, refunds, discount codes
- **Done when**: Customers can complete real purchases

### v0.7.0 - Shipping & Tax (2-3 weeks)
- Shippo integration, label generation, Stripe Tax
- **Done when**: Artisan can generate shipping labels

### v0.8.0 - Artisan Tools (3-4 weeks)
- Dashboard, analytics, customer management, bulk actions
- **Done when**: Artisan can manage entire business from dashboard

### v0.9.0 - Merch & Inventory (2-3 weeks)
- Inventory-based products, stock tracking, low-stock alerts
- **Done when**: Artisan can sell branded merchandise

### v1.0.0 - Reviews, Polish & Launch (4-6 weeks)
- Review system, mobile-responsive design, accessibility, security review, beta testing
- **Done when**: Platform ready for real customers

**Total Estimated Time**: 9-12 months to v1.0 full launch

---

## Post-MVP Backlog

### High Priority
- Enhanced analytics dashboard
- Email when capacity opens (waitlist notifications)
- Pattern-to-product upsell enhancements

### Medium Priority
- Subscription queue (members get priority)
- Community page (user-submitted projects)
- Gift orders with custom messages
- Multi-artisan support (hire help for fulfillment)

### Low Priority
- Social media integration
- Referral program
- Loyalty points
- PWA (offline pattern access)

### Long-Term Vision: White-Label SaaS
- Multi-tenancy features (tenant signup, billing, subdomain routing)
- Self-service artisan onboarding
- API documentation for extensions
- Deployment guide for self-hosting

---

## Key Reference Documents

1. **[Comprehensive Roadmap](../plans/ROADMAP-COMPREHENSIVE.md)** - Complete roadmap with all decisions (1200+ lines)
2. **[Getting Started Implementation](./GETTING-STARTED-IMPLEMENTATION.md)** - Step-by-step setup guide
3. **[ADR-005: Adapter Architecture](../plans/decisions/ADR-005-adapter-architecture.md)** - Zero vendor lock-in pattern
4. **[ADR-006: Next.js App Router](../plans/decisions/ADR-006-nextjs-app-router.md)** - Frontend framework choice
5. **[.env.example](../.env.example)** - All environment variables documented

---

## Important Conventions

### Naming
- **Adapters**: `EmailProvider` (interface), `ResendEmailProvider` (implementation)
- **No "I" prefix**: Avoid `IEmailProvider`
- **Test doubles**: `MockEmailProvider`, `InMemoryEmailProvider`, `RecordingEmailProvider`, `StubEmailProvider`

### File Organization
- **Monorepo structure**: `apps/` (web, workers), `packages/` (adapters, database, types, ui)
- **Tests alongside code**: `foo.ts` → `foo.test.ts`
- **Migrations**: `migrations/` directory (Drizzle generates)
- **Infrastructure**: `terraform/` directory

### Code Quality
- **ASCII only**: No Unicode arrows, emoji, curly quotes in code/docs
- **Type safety**: TypeScript strict mode, Zod validation
- **Error handling**: Helpful but not revealing, graceful degradation
- **No premature optimization**: Make it work → make it right → make it fast

---

## Success Metrics

### Artisan Sustainability
- Manageable workload, no burnout
- Clear capacity boundaries
- Profitable at 20+ orders/month

### Customer Satisfaction
- High reviews, low refunds
- Repeat customers
- Transparent delivery expectations

### Technical Health
- 85%+ test coverage
- Fast page loads (<2s)
- Zero downtime deployments
- Low operational overhead

---

This document is a living summary. Update it when major decisions change or new patterns emerge.
