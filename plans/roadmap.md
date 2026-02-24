# Roadmap

This document tracks what we're building, why, and in what order.

**Last Updated**: 2026-02-23 | **Current Milestone**: v0.1.0 Foundation

---

## Quick Navigation

- [Vision](#vision)
- [Current Milestone](#v010----foundation)
- [All Milestones](#milestones)
- [Backlog](#backlog)
- [Reference](#reference)

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| [x] | Complete |
| [/] | In progress |
| [ ] | Planned |
| [?] | Future / under consideration |

---

## Vision

Artisan Commerce becomes the standard for transparent, sustainable made-to-order craft businesses. Artisans manage their capacity honestly, customers receive realistic expectations, and the platform handles the complexity of queue management, payments, and order fulfillment. At its best, it proves that handmade commerce can be both profitable and humane.

### Core Principles

**Cheap**: Stay on Cloudflare free tier, ~$1-5/month until 100+ orders/month  
**Convenient**: Passwordless auth, beautiful dashboard, mobile-first design  
**Secure**: Geographic restrictions, RBAC, rate limiting, WCAG 2.1 AA, SLSA Level 3  
**Portable**: Zero vendor lock-in via comprehensive adapter pattern  
**Simple**: Straightforward frameworks, standard patterns, clear documentation

### Platform Scope

- **Web-only** with mobile-responsive design
- No native mobile apps planned
- Mobile-first design approach
- Touch-friendly UI for tablets/phones

### Timeline

- **Target**: 9-12 months to v1.0 full launch
- **No hard deadline**: Quality over speed
- **Approach**: Full launch with all features (no soft launch)

---

## Milestones

## v0.1.0 -- Foundation [/]

**Goal**: Repository structure, documentation, and planning complete. Ready to start building.

**Completed**:
- [x] Repository structure and tooling
- [x] Documentation framework customized for Artisan Commerce
- [x] Project vision and domain model documented
- [x] Architecture decision records (ADR-001 through ADR-006)
- [x] Initial user stories
- [x] Technology stack decision (ADR-002: Cloudflare serverless)
- [x] Infrastructure as Code approach (ADR-003: Terraform)
- [x] Database choice (ADR-004: Cloudflare D1)
- [x] Adapter architecture (ADR-005: Zero vendor lock-in)
- [x] Frontend framework (ADR-006: SvelteKit)
- [x] Comprehensive roadmap with all decisions
- [x] Repository cleanup and consolidation

**Remaining**:
- [ ] Create project structure (src/, workers/, migrations/, terraform/)
- [ ] Initialize SvelteKit app with Tailwind + shadcn-svelte
- [ ] Initialize Hono Workers API
- [ ] Create adapter interfaces (EmailProvider, ShippingProvider, etc.)
- [ ] Create mock/inmemory adapters for testing
- [ ] Initialize Drizzle schema (User, Project, Order tables)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure SLSA provenance generation
- [ ] Configure Dependabot
- [ ] Set up Git Flow branches (main, develop)
- [ ] Write development environment setup guide
- [ ] Verify `mise run dev` starts all services

**Database**:
- [ ] Initial migration with users, projects, orders tables

**Tests**:
- [ ] Example unit test (queue calculations)
- [ ] Example integration test (API endpoint)
- [ ] Example E2E test (visit homepage)

**Done When**: 
- New contributor can clone repo, run `mise run setup && mise run dev`, and see SvelteKit + Hono running
- Tests pass (`mise run test`)
- CI pipeline runs successfully on PR
- Can inject mock EmailProvider and write a test

**Estimated Time**: 1-2 weeks

---

## v0.2.0 -- Authentication & User Management [ ]

**Goal**: Users can create accounts and sign in. Role-based access control in place.

**Features**:
- [ ] User registration (email input only)
- [ ] Magic link generation (JWT with 15min expiry)
- [ ] Email sending via EmailProvider (mock locally, Resend in prod)
- [ ] Magic link verification endpoint
- [ ] JWT session token (24hr expiry, httpOnly cookie)
- [ ] User profile CRUD (name, email, phone, default address)
- [ ] Role-based middleware (customer, artisan)
- [ ] Email preference management (granular per-event)
- [ ] Geographic restriction middleware (Utah IP for artisan)
- [ ] Rate limiting middleware (sensitive operations)

**Database**:
- [ ] users table
- [ ] user_email_preferences table

**Tests** (TDD):
- [ ] Unit: JWT generation/verification, magic link expiry
- [ ] Integration: Auth flow (register → email → verify → logged in)
- [ ] E2E: Full user registration and login flow

**Done When**: 
- Customers can register and log in via magic link
- Artisan can log in (Utah IP required)
- Role-based access enforced
- Email preferences work

**Estimated Time**: 2-3 weeks

---

## v0.3.0 -- Core Entities (Projects & Patterns) [ ]

**Goal**: Artisan can create and manage projects and patterns. Customers can browse them.

**Features**:
- [ ] Project CRUD (artisan only)
  - [ ] Multiple images upload (client-side optimization)
  - [ ] Project options system (material, color, size, custom text)
  - [ ] Conditional option dependencies (artisan defines)
  - [ ] Queue tier assignment (5 tiers with guidelines)
  - [ ] Pricing: simple additive modifiers
  - [ ] Enable/disable toggle
- [ ] Pattern CRUD (artisan only)
  - [ ] PDF upload (R2 storage via FileStorage adapter)
  - [ ] Preview image generation
  - [ ] Bidirectional project ↔ pattern linking
  - [ ] Enable/disable toggle
- [ ] Customer Views:
  - [ ] Projects gallery (grid layout, filtering, sorting)
  - [ ] Project detail page (images, options, pricing, delivery estimate)
  - [ ] Patterns gallery
  - [ ] Pattern detail page (preview, linked projects)
- [ ] Favorites system
  - [ ] Add/remove favorites
  - [ ] Shareable wishlist URL
  - [ ] Favorites count on projects (artisan analytics)

**Database**:
- [ ] projects table
- [ ] project_images table
- [ ] project_options table
- [ ] patterns table
- [ ] favorites table

**Tests** (TDD):
- [ ] Unit: Option dependencies, pricing calculations
- [ ] Integration: CRUD operations, file uploads
- [ ] E2E: Artisan creates project, customer browses and favorites

**Done When**: 
- Artisan can create 10-20 projects with options
- Customers can browse, filter, sort, favorite
- Images upload and display correctly
- Pricing calculates correctly

**Estimated Time**: 3-4 weeks

---

## v0.4.0 -- Queue System [ ]

**Goal**: The core differentiator -- queue-based production capacity management.

**Features**:
- [ ] Queue configuration (artisan dashboard)
  - [ ] Weekly capacity input
  - [ ] Pause button (vacation mode)
  - [ ] Capacity utilization display
- [ ] Queue calculation algorithm
  - [ ] Dynamic delivery estimates
  - [ ] Position tracking
  - [ ] 5-tier weight system
- [ ] Queue entry creation (when order paid)
- [ ] Queue visualization (customers)
  - [ ] Show position + estimate on order detail
  - [ ] Show estimated delivery on project pages
- [ ] Artisan queue dashboard
  - [ ] Kanban board (drag-and-drop reordering)
  - [ ] Status-based columns
  - [ ] Capacity utilization metrics
- [ ] Waitlist system
  - [ ] Email signup when capacity full
  - [ ] Estimated availability display
  - [ ] Notify when capacity opens

**Database**:
- [ ] queue_entries table
- [ ] queue_config table (single row)

**Tests** (TDD):
- [ ] Unit: Queue calculations, edge cases (cancellations, reordering)
- [ ] Integration: Queue entry creation, position updates
- [ ] E2E: Full queue flow (order → queue → delivery estimate)

**Done When**: 
- Queue accurately calculates delivery estimates
- Artisan can manage capacity and reorder queue
- Customers see position and estimate
- Waitlist works when capacity full

**Estimated Time**: 3-4 weeks

---

## v0.5.0 -- Shopping Cart & Orders [ ]

**Goal**: Users can add items to cart and place orders (without payment yet).

**Features**:
- [ ] Shopping cart functionality
  - [ ] Add/remove items
  - [ ] Quantity adjustment
  - [ ] Cart persistence (logged-in users)
  - [ ] Pattern bundle upsell (cart page)
- [ ] Order creation (without payment)
- [ ] Order lifecycle state machine (8 states)
- [ ] Order modification system
  - [ ] 12-hour free window (configurable)
  - [ ] Per-order override (artisan can extend)
  - [ ] Modification UI (change options, add/remove items)
  - [ ] Cancellation with $15 flat fee after window
- [ ] Order messages (threaded chat)
  - [ ] Customer ↔ artisan conversation
  - [ ] Artisan notification preferences
  - [ ] Unified messages inbox (customer)
- [ ] Contact form (general messages, no order)
- [ ] Order history view

**Database**:
- [ ] orders table
- [ ] order_items table
- [ ] messages table

**Tests** (TDD):
- [ ] Unit: Order lifecycle, modification windows, cancellation fees
- [ ] Integration: Cart operations, order creation, message sending
- [ ] E2E: Full cart → order → modify → cancel flow

**Done When**: 
- Customers can add to cart, place orders, communicate with artisan
- Order modification rules enforced
- Messages work (order + contact)

**Estimated Time**: 3-4 weeks

---

## v0.6.0 -- Payment Integration [ ]

**Goal**: Stripe integration for checkout and refunds.

**Features**:
- [ ] Stripe account setup
- [ ] PaymentProvider adapter + Stripe implementation
- [ ] Checkout flow
  - [ ] Stripe Checkout session creation (hosted)
  - [ ] Success/cancel handling
  - [ ] Order marked "paid" after successful payment
  - [ ] Queue entry created
- [ ] Webhook handling
  - [ ] Payment confirmation
  - [ ] Refund events
  - [ ] Signature verification via adapter
- [ ] Refund processing (artisan UI)
  - [ ] Full/partial refund with reason tracking
  - [ ] Stripe API integration
  - [ ] Order status updates
- [ ] Discount codes
  - [ ] Artisan management page (create, track usage)
  - [ ] One-time use enforcement
  - [ ] % off or $ off types
  - [ ] Apply at checkout

**Database**:
- [ ] discount_codes table
- [ ] discount_code_usage table

**Tests** (TDD):
- [ ] Unit: Discount code validation, refund calculations
- [ ] Integration: Payment flows (Stripe test mode), webhooks
- [ ] E2E: Full checkout → payment → confirmation flow

**Done When**: 
- Customers can complete real purchases
- Artisan can issue refunds
- Discount codes work
- Webhooks handled correctly

**Estimated Time**: 2-3 weeks

---

## v0.7.0 -- Shipping & Tax [ ]

**Goal**: Shipping label generation and automatic tax calculation.

**Features**:
- [ ] ShippingProvider adapter + Shippo implementation
- [ ] Shipping rate calculation (USPS)
  - [ ] Real-time rates at checkout
  - [ ] International shipping support
- [ ] Shipping label generation
  - [ ] Artisan clicks "Create Label" → Shippo API
  - [ ] Label PDF stored (R2 via FileStorage)
  - [ ] Tracking number saved
  - [ ] Order auto-marked "shipped"
- [ ] TaxCalculator adapter + Stripe Tax implementation
  - [ ] Automatic tax calculation at checkout
  - [ ] Tax stored per order item (accounting)
- [ ] Bulk shipping actions
  - [ ] Select multiple orders
  - [ ] Create labels in batch
  - [ ] Export to CSV

**Database**:
- [ ] shipping_labels table

**Tests** (TDD):
- [ ] Unit: Shipping calculations, tax calculations
- [ ] Integration: Shippo API, Stripe Tax API
- [ ] E2E: Full shipping flow (create label → mark shipped)

**Done When**: 
- Artisan can calculate shipping, generate labels, collect tax automatically
- Bulk actions work
- International shipping works

**Estimated Time**: 2-3 weeks

---

## v0.8.0 -- Artisan Tools [ ]

**Goal**: Comprehensive artisan dashboard for managing entire business.

**Features**:
- [ ] Artisan dashboard landing page
  - [ ] Metrics cards (revenue, pending orders, queue utilization, low stock)
  - [ ] Quick actions
- [ ] Comprehensive analytics
  - [ ] Revenue charts (daily, weekly, monthly)
  - [ ] Popular projects (sales, favorites)
  - [ ] Queue saturation over time
  - [ ] Customer acquisition metrics
- [ ] Customer management
  - [ ] Full customer list with search
  - [ ] Customer detail view (order history, reviews, favorites, total spent, messages)
  - [ ] Password reset for customers
- [ ] Order management enhancements
  - [ ] Basic search (customer name, email, order ID)
  - [ ] Bulk actions (status updates, email, CSV export)
  - [ ] Per-order production time override
  - [ ] Admin cancel with optional refund
- [ ] Material/color option management
  - [ ] Global option pools + per-project custom
  - [ ] Admin can add new options anytime
- [ ] Email customer feature (templates)
- [ ] Inventory alerts (email + dashboard for merch)

**Database**:
- [ ] daily_stats table (analytics cache)
- [ ] customer_stats table (analytics cache)

**Tests** (TDD):
- [ ] Unit: Analytics calculations, search logic
- [ ] Integration: Admin workflows, customer analytics
- [ ] E2E: Full artisan dashboard flows

**Done When**: 
- Artisan can manage entire business from beautiful dashboard
- Analytics accurate and useful
- Bulk actions work
- Customer management complete

**Estimated Time**: 3-4 weeks

---

## v0.9.0 -- Merch & Inventory [ ]

**Goal**: Traditional inventory-based products separate from handmade queue.

**Features**:
- [ ] Merch CRUD (artisan)
- [ ] Merch gallery (customers)
- [ ] Inventory management
  - [ ] Stock quantity tracking
  - [ ] Low-stock alerts (email + dashboard)
  - [ ] Out-of-stock: show badge + email waitlist
- [ ] Mixed cart handling (handmade + merch ship together)
- [ ] Merch in order flow (separate from queue)

**Database**:
- [ ] merch table

**Tests** (TDD):
- [ ] Unit: Inventory tracking, out-of-stock logic
- [ ] Integration: Merch CRUD, mixed orders
- [ ] E2E: Full merch flow (browse → order → ship)

**Done When**: 
- Artisan can sell branded merchandise with traditional inventory
- Mixed carts work correctly
- Inventory alerts work

**Estimated Time**: 2-3 weeks

---

## v1.0.0 -- Reviews, Polish & Launch [ ]

**Goal**: Stable, documented, and ready for production use.

**Features**:
- [ ] Review system
  - [ ] Verified buyers only (after delivery)
  - [ ] Star rating + text comment
  - [ ] Delivery accuracy tracking (on time? yes/no)
  - [ ] Artisan public responses
  - [ ] Review moderation (hide + ban user option)
- [ ] TranslationProvider implementation
  - [ ] JSON files for English
  - [ ] Framework ready for additional languages
  - [ ] Language switcher UI (shows only English for now)
- [ ] Mobile-responsive design (all pages)
  - [ ] Mobile-first design system
  - [ ] Touch-friendly UI (kanban drag-and-drop, etc.)
  - [ ] Real device testing (iPhone, Android)
- [ ] Accessibility compliance (WCAG 2.1 AA)
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast
  - [ ] Form labels and ARIA
- [ ] Error handling improvements
  - [ ] Helpful but not revealing errors
  - [ ] Graceful degradation + retries
  - [ ] Friendly error pages (404, 500)
- [ ] Performance optimization
  - [ ] Image lazy loading
  - [ ] Route-based code splitting
  - [ ] Caching strategy (delivery estimates, etc.)
- [ ] User documentation
  - [ ] Comprehensive user guide
  - [ ] Inline help text and tooltips
  - [ ] FAQ
  - [ ] Shipping/returns policies
- [ ] Legal pages
  - [ ] Terms of Service (template from Termly/TermsFeed)
  - [ ] Privacy Policy (GDPR-compliant)
  - [ ] Cookie consent (minimal tracking)
- [ ] Security review
  - [ ] Penetration testing (self or service)
  - [ ] Dependency audit (npm audit, Dependabot)
  - [ ] OWASP Top 10 checklist
- [ ] Disaster recovery
  - [ ] Backup testing (restore drill)
  - [ ] Recovery runbook documented
- [ ] Beta testing
  - [ ] Friends/family beta (5-10 people)
  - [ ] Feedback incorporation
  - [ ] Bug fixes
- [ ] Domain setup
  - [ ] Purchase domain
  - [ ] Configure DNS (Cloudflare)
  - [ ] Email setup via Resend
- [ ] Monitoring & alerting
  - [ ] Tiered alerting (critical → engineer, business-critical → both)
  - [ ] Cloudflare dashboard monitoring
- [ ] Launch checklist
  - [ ] All features complete
  - [ ] Test coverage >= 85%
  - [ ] Comprehensive E2E tests (checkout, admin, edge cases)
  - [ ] Mobile device testing (real devices)
  - [ ] Performance acceptable ("feels fast")
  - [ ] Documentation complete
  - [ ] Legal pages live
  - [ ] 10-20 projects ready
  - [ ] Beta feedback addressed
  - [ ] Engineer + artisan personally tested all flows 3x

**Database**:
- [ ] reviews table
- [ ] review_responses table

**Tests** (TDD):
- [ ] Unit: Review validation, moderation logic
- [ ] Integration: Review CRUD, response system
- [ ] E2E: Full review flow (order → deliver → review → respond)

**Done When**: 
- Platform is ready for real customers and real transactions
- All features complete and tested
- Security reviewed
- Documentation complete
- Beta testing successful
- Launch checklist complete

**Estimated Time**: 4-6 weeks

---

## Backlog

Ideas that don't have a version yet. Promoted to a milestone when prioritized.

### High priority
- Artisan analytics dashboard enhancements (more detailed charts, export to CSV)
- Email notifications when queue capacity opens up
- Pattern-to-product integration (upsell: "Make it yourself or order one made")
- Custom sizing (made-to-measure) - text field for measurements

### Medium priority
- Subscription queue (members get priority)
- Community page (user-submitted projects using patterns)
- Seasonal drops (limited ordering windows)
- Limited pattern releases (scarcity-based launches)
- Multi-color pricing complexity
- Gift orders with custom messages
- Wishlist sharing enhancements
- Multi-artisan support (hire help for fulfillment)

### Low priority / nice to have
- Social media integration (share projects on Pinterest, Instagram)
- Referral program
- Loyalty points
- Live chat support
- Video tutorials for patterns
- Pattern difficulty ratings and time estimates
- Progressive Web App (PWA) for offline pattern access

### White-Label SaaS (Long-term Vision)
- Multi-tenancy features
- Tenant signup and onboarding
- Billing and subscription system
- Subdomain routing
- Custom domain support
- Self-service configuration
- Payment processing setup wizard
- Branding customization
- Email template editor

---

## Reference

### Technology Stack Summary

**Frontend**: SvelteKit + Tailwind CSS + shadcn-svelte  
**Backend**: Hono on Cloudflare Workers  
**Database**: Drizzle ORM + Cloudflare D1 (SQLite)  
**Storage**: Cloudflare R2 (S3-compatible)  
**Email**: Resend (EmailProvider adapter)  
**Payments**: Stripe (PaymentProvider adapter)  
**Shipping**: Shippo (ShippingProvider adapter)  
**Tax**: Stripe Tax (TaxCalculator adapter)  
**Testing**: Vitest + Playwright  
**CI/CD**: GitHub Actions with SLSA Level 3  
**IaC**: Terraform + Wrangler

**Cost**: ~$1-5/month (domain + transaction fees)

See [ADR-002](./decisions/ADR-002-tech-stack.md) for full technology stack rationale.

### Key Architecture Decisions

1. **Queue System** ([ADR-001](./decisions/ADR-001-example.md)): 5-tier weight system, FIFO with manual exceptions
2. **Tech Stack** ([ADR-002](./decisions/ADR-002-tech-stack.md)): Cloudflare serverless edge platform
3. **Infrastructure** ([ADR-003](./decisions/ADR-003-infrastructure-as-code.md)): Terraform + Wrangler
4. **Database** ([ADR-004](./decisions/ADR-004-database-cloudflare-d1.md)): Cloudflare D1 (SQLite)
5. **Adapters** ([ADR-005](./decisions/ADR-005-adapter-architecture.md)): Zero vendor lock-in pattern
6. **Frontend** ([ADR-006](./decisions/ADR-006-sveltekit.md)): SvelteKit for simplicity

### Domain Model

**Core Entities**: User, Project, Pattern, Order, Order Item, Queue Entry  
**Supporting**: Review, Message, Favorite, Discount Code, Shipping Label, Merch

See [domain-model.md](../docs/domain-model.md) for complete entity specifications.

### Business Rules

**Queue**: 5-tier weight system (XSmall=1 to XLarge=8), FIFO with manual reorder  
**Orders**: 8 lifecycle states, 12-hour free modification window, $15 cancellation fee  
**Pricing**: Simple additive modifiers (base + material + size + custom)  
**Shipping**: USPS only (v1.0), calculated rates via Shippo  
**Tax**: Automatic via Stripe Tax (0.5% fee)

See [business-rules.md](../docs/business-rules.md) for complete business logic.

---

## How to Use This Document

- **Check off items** as they're completed: `- [x]`
- **Update status symbols** as work progresses: `[ ]` → `[/]` → `[x]`
- **Add new milestones** as the project evolves
- **Move backlog items** into milestones when they're prioritized
- **Keep acceptance criteria** realistic and measurable
- **Update "Last Updated"** date at top when making changes

---

## Related Documents

- [Business Rules](../docs/business-rules.md) - Complete business logic and workflows
- [Domain Model](../docs/domain-model.md) - Entity specifications and database schema
- [Stories](./stories/) - User stories with acceptance criteria
- [Decisions](./decisions/) - Architecture decision records (ADRs)
- [Vision](./vision.md) - Original brainstorming session
- [CHANGELOG](../CHANGELOG.md) - What shipped in each release
- [Architecture](../docs/03-architecture.md) - Architectural principles
- [Testing](../docs/05-testing.md) - Testing philosophy and strategy
- [Git Workflow](../docs/07-git-workflow.md) - Branching and commit conventions
