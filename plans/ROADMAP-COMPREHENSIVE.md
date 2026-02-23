# Artisan Commerce - Comprehensive Roadmap

**Last Updated**: 2024-07-23

This document contains the complete, finalized roadmap with all architectural decisions, business rules, and implementation details captured from extensive requirements gathering.

---

## Table of Contents

1. [Vision & Principles](#vision--principles)
2. [Core Decisions](#core-decisions)
3. [Technology Stack](#technology-stack)
4. [Domain Model](#domain-model)
5. [Business Rules](#business-rules)
6. [Milestone Roadmap](#milestone-roadmap)
7. [Post-MVP Backlog](#post-mvp-backlog)

---

## Vision & Principles

### Vision Statement

Artisan Commerce becomes the standard for transparent, sustainable made-to-order craft businesses. Artisans manage their capacity honestly, customers receive realistic expectations, and the platform handles the complexity of queue management, payments, and order fulfillment. At its best, it proves that handmade commerce can be both profitable and humane.

### Core Principles

**Cheap**: Optimize for cost efficiency
- Stay on Cloudflare free tier as long as possible
- Transaction-based pricing only (Stripe, Shippo)
- Evaluate ROI for every paid service
- Target: ~$1-5/month until 100+ orders/month

**Convenient**: Maximum usability for artisan and customers
- Passwordless authentication (magic links)
- Beautiful artisan dashboard with comprehensive features
- Mobile-first responsive design
- Modern best practices for developer experience

**Secure**: Multi-layered security
- Geographic restriction (Utah IP for artisan access)
- Role-based access control
- Rate limiting on sensitive operations
- WCAG 2.1 AA accessibility compliance
- SLSA Level 3 supply chain security

**Portable**: Zero vendor lock-in
- Comprehensive adapter pattern for ALL external services
- Multi-database support (D1 → Postgres migration path)
- Framework portability (Next.js can deploy anywhere)
- Standard APIs and patterns

**LLM-Friendly**: Optimize for AI-assisted development
- Use most popular frameworks (Next.js, React, TypeScript)
- Standard design patterns (Factory, DI, Repository)
- Comprehensive JSDoc documentation
- Conventional project structure

### Platform Scope

- **Web-only** with mobile-responsive design
- No native mobile apps planned
- Mobile-first design approach
- Touch-friendly UI for tablets/phones

### Team Structure

- **Engineer (You)**: Software development, infrastructure, monitoring via CLI
- **Artisan (Wife)**: Business operations, order fulfillment via web dashboard
- **Roles**: Customer (buyers), Artisan (admin), SuperAdmin (engineer, CLI only)

### Success Metrics

- **Artisan sustainability**: Manageable workload, no burnout
- **Customer satisfaction**: High reviews, low refunds, repeat customers
- **Financial**: Profitable at 20+ orders/month

### Timeline

- **Target**: 9-12 months to v1.0 full launch
- **No hard deadline**: Quality over speed
- **Approach**: Full launch with all features (no soft launch)

---

## Core Decisions

### Architectural Decisions

All decisions documented in ADRs (Architecture Decision Records):

1. **ADR-001**: Queue-Based Production Capacity Management
   - 5-tier weight system (XSmall=1, Small=2, Medium=4, Large=6, XLarge=8)
   - FIFO with manual exceptions
   - Dynamic delivery estimates
   - Capacity limits with waitlist

2. **ADR-002**: Technology Stack - Cloudflare Serverless
   - Next.js 14 App Router + Cloudflare Pages
   - Hono on Cloudflare Workers
   - Drizzle ORM + D1 database
   - ~$1/month cost

3. **ADR-003**: Infrastructure as Code with Terraform
   - Terraform provisions resources
   - Wrangler deploys code and manages secrets
   - Git Flow branching (main/develop/feature/release)

4. **ADR-004**: Database - Cloudflare D1
   - SQLite-as-a-service
   - Multi-tenant schema from start
   - Migration path to Postgres ready

5. **ADR-005**: Comprehensive Adapter Architecture
   - Zero vendor lock-in
   - All external services wrapped
   - Four test double types per adapter
   - Standard naming (EmailProvider, ResendEmailProvider)

6. **ADR-006**: Next.js App Router for Maximum LLM Support
   - Best AI assistance (95% code accuracy)
   - Huge ecosystem and community
   - Excellent Cloudflare compatibility
   - Framework portability

### Key Business Decisions

**Queue System**:
- Predefined 5-tier weights (artisan assigns tier per project)
- Strict FIFO with manual exceptions (drag-and-drop kanban)
- Show position + estimate to customers
- Daily digest emails (only when changes occur)
- Capacity: simple number + pause button
- Waitlist with estimated availability when full

**Order Management**:
- 8 lifecycle states: pending_payment → paid → in_queue → in_production → shipped → delivered + cancelled + refunded
- 12-hour free modification window (configurable + per-order override)
- $15 flat cancellation fee after 12 hours
- Case-by-case artisan approval for in-production cancellations
- Multi-item orders ship together
- Custom sizing text field (made-to-measure in v1.0)
- Threaded message chat on orders

**Pricing & Payment**:
- Simple additive modifiers (base + material + size)
- Full payment upfront via Stripe Checkout (hosted)
- Discount codes: artisan creates one-time-use (% or $ off)
- Shipping: USPS calculated rates + integrated labels (Shippo)
- Tax: Automatic calculation (Stripe Tax)
- International shipping: Worldwide from v1.0

**Reviews**:
- After delivery only
- Stars + text (no customer photos)
- Artisan can respond publicly
- Artisan can hide + ban user

**Artisan Dashboard**:
- Landing: Metrics overview (revenue, queue, alerts)
- Kanban board with status-based columns (drag-and-drop)
- Full customer management + analytics
- Comprehensive analytics dashboard
- Bulk actions (status updates, email, CSV export)
- Low-stock alerts (email + dashboard)
- Email customer feature with templates
- USPS label integration
- Refund UI with amount/reason tracking

---

## Technology Stack

### Frontend

**Framework**: Next.js 14 App Router
- Deployed to Cloudflare Pages
- Server Components for zero-JS static content
- Server Actions for mutations (no API routes needed)
- Route Groups for organization

**Styling**: Tailwind CSS + shadcn/ui
- Utility-first, mobile-first
- Copy-paste components (no dependency)
- Excellent accessibility

**Forms**: React Hook Form + Zod
- Type-safe validation
- Shared schemas (frontend + backend)

**State**: Next.js loaders/actions + URL state
- Server state via React Server Components
- URL query params for shareable state
- Zustand for complex client state (if needed)

### Backend

**Framework**: Hono on Cloudflare Workers
- Lightweight, fast, edge-optimized
- Express-like API (LLM-friendly)
- Built-in middleware (auth, rate limiting)

**Database**: Drizzle ORM + Cloudflare D1
- Type-safe SQL queries
- Multi-database support (D1, Postgres, MySQL)
- Repository pattern for abstraction

**Authentication**: Custom JWT + Magic Links
- jose library for JWT
- Passwordless (email magic links)
- 24-hour session expiry
- Wrapped in AuthProvider adapter

### External Services (All Wrapped in Adapters)

**Email**: Resend (free tier: 3000/month)
- EmailProvider interface
- React Email for templates

**Shipping**: Shippo ($0.05/label)
- ShippingProvider interface
- USPS only for v1.0

**Payment**: Stripe (2.9% + 30¢)
- PaymentProvider interface
- Stripe Checkout (hosted, zero PCI burden)

**Tax**: Stripe Tax (0.5% of tax collected)
- TaxCalculator interface

**Storage**: Cloudflare R2 (free tier: 10GB)
- FileStorage interface
- S3-compatible API

**Translation**: JSON files initially
- TranslationProvider interface
- Ready for Lokalise/Phrase later

### Development Tools

**Runtime**: Node.js everywhere (dev/CI/prod parity)
- No Bun (avoid dev/prod differences)

**Monorepo**: pnpm workspaces
- Fast installs, efficient disk usage
- Shared packages: adapters, database, types, ui

**Testing**: TDD with Vitest + Playwright
- Unit tests: Vitest + React Testing Library
- E2E tests: Playwright (full suite every PR)
- Target: 85%+ coverage

**Linting**: Biome (replaces ESLint + Prettier)
- Fast, all-in-one
- Consistent formatting

**CI/CD**: GitHub Actions
- SLSA Level 3 provenance
- Full E2E tests every PR
- Dependabot for security updates

**Git**: Git Flow branching
- main (production)
- develop (integration)
- feature/* (feature branches)
- release/* (release branches)

### Infrastructure

**Hosting**: Cloudflare Pages + Workers
- Pages: Next.js frontend
- Workers: Hono API backend
- D1: Database
- R2: File storage

**IaC**: Terraform + Wrangler
- Terraform: Provision resources
- Wrangler: Deploy code, manage secrets

**Monitoring**: Cloudflare Dashboard
- Manual cost checks initially
- Add to artisan dashboard in v1.1+

**Staging**: Add later (after v1.0)
- Start with local dev + production only
- Add staging when real customers exist

---

## Domain Model

### Multi-Tenant Architecture

**Design for multi-tenancy from start** (future white-label SaaS):

```sql
-- All tables include tenant_id for isolation
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT,
  name TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Example: users table with tenant_id
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  UNIQUE(tenant_id, email),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

**Row-Level Security**: All repository methods filter by tenant_id

**Initial Tenant**: artisan-commerce.com (single tenant for v1.0)

### Core Entities

**User**
- Roles: customer, artisan, super_admin
- Fields: email, name, phone (optional), role, created_at, updated_at, last_login_at
- Default address (JSON)
- Email preferences (granular per-event)

**Project** (Made-to-Order Handmade Items)
- Type: crochet, knitting, embroidery, cross_stitch, sewn
- Base price, production time (weeks), queue tier
- Multiple images (display order)
- Options: material, color, size, custom text
- Option dependencies (conditional logic)
- Pattern link (optional)
- Enabled/disabled flag

**Pattern** (Digital/Physical Products)
- Name, description, difficulty, price
- File URL (R2 PDF), preview URLs (JSON array)
- Bidirectional link to projects
- Enabled/disabled flag

**Order**
- Customer, status, subtotal, tax, shipping, discount, total
- Shipping address (JSON snapshot)
- Tracking number, shipped_at, delivered_at
- Queue position, estimated delivery date
- Modification window (12 hours, configurable)
- Payment intent ID (Stripe)
- Discount code reference

**Order Items**
- Order reference, item type (project/pattern/merch)
- Item ID, quantity, unit price (snapshot)
- Selected options (JSON: material, color, size, custom_measurements)
- Tax rate, tax amount, subtotal

**Queue**
- Queue entries: order_id, position, weight, entered_at, estimated_completion_at
- Queue config: weekly_capacity, is_paused, paused_reason

**Merch** (Inventory-Based Products)
- Name, description, price
- Stock quantity, low stock threshold
- Enabled/disabled flag

**Review**
- Customer, project, order references
- Rating (1-5 stars), comment, delivery_on_time (boolean)
- Status (visible/hidden), hidden_reason, hidden_by, hidden_at

**Review Responses**
- Review reference, artisan, response text, created_at

**Messages** (Order Chat + Contact Form)
- Type: order or contact
- Order reference (nullable), sender, sender_type, message, created_at
- Unified inbox for customers

**Favorites**
- Customer, project references
- Created_at, notified_at (for future alerts)
- Shareable wishlist URL

**Discount Codes**
- Code, type (percent/fixed), value, usage_limit (1), expires_at
- Created_by (artisan), created_at

**Discount Code Usage**
- Code, order references, used_at

**Shipping Labels**
- Order reference, label_url, tracking_number
- Carrier (usps), service, cost, created_at

**Email Preferences**
- User reference, preference_type, enabled
- Types: order_confirmation, order_shipped, queue_position_changed, queue_capacity_opened, low_stock_alert, marketing

**Analytics Cache**
- daily_stats: date, total_revenue, order_count, new_customer_count, average_order_value, queue_capacity_utilization
- customer_stats: customer_id, total_spent, order_count, favorite_count, review_count, last_order_at

---

## Business Rules

### Queue System

**Queue Weight Tiers**:
- XSmall = 1 (coasters, small accessories)
- Small = 2 (hats, scarves)
- Medium = 4 (baby blankets, small garments)
- Large = 6 (sweaters, large blankets)
- XLarge = 8 (king-size blankets, complex projects)

**Artisan assigns tier** when creating project (with guidelines in UI)

**Queue Calculation**:
```
estimated_delivery = (current_queue_weight / weekly_capacity) * 7 + production_time_weeks * 7 + shipping_days
```

**Queue Position**:
- Strict FIFO by default
- Artisan can manually reorder (drag-and-drop kanban)
- Show position + estimate to customers

**Capacity Management**:
- Artisan sets weekly capacity (simple number input)
- Pause button (vacation mode)
- When full: show waitlist with estimated availability
- Waitlist stored in user email preferences

**Notifications**:
- Daily digest emails (only when queue position/delivery changes)
- Smart timing: send when change occurs OR max 1 week since last update

### Order Lifecycle

**States**:
1. pending_payment (cart checked out, awaiting payment)
2. paid (payment successful, entering queue)
3. in_queue (waiting for production)
4. in_production (artisan working on it)
5. shipped (tracking number assigned)
6. delivered (confirmed delivery)
7. cancelled (customer or artisan cancelled)
8. refunded (payment refunded)

**Modification Rules**:
- First 12 hours: Free modifications (change options, add/remove items, cancel)
- 12-24 hours: Not allowed (or $15 flat fee if artisan enables per-order override)
- 24+ hours: $15 flat cancellation fee
- In production: Case-by-case artisan approval (can cancel with higher fee or no refund)

**Cancellation Fees**:
- 0-12 hours: Free
- 12+ hours: $15 flat fee
- In production: Artisan decides (50-100% fee typical)

**Multi-Item Orders**:
- Ship together when all items complete
- Single tracking number

**Custom Sizing**:
- Text field in order item options
- Example: "Chest: 42in, Length: 28in, Sleeve: 24in"

### Pricing

**Simple Additive Modifiers**:
```
final_price = base_price + material_modifier + size_modifier + custom_text_modifier
```

Example:
- Sweater base: $50
- Wool material: +$10
- XL size: +$5
- Custom text: +$8
- Total: $73

**Option Dependencies**:
- Artisan can define conditional logic
- Example: If material=wool, only show colors: blue, red, green
- Stored as JSON in project_options.dependencies

### Shipping

**USPS Only** (v1.0):
- Calculated rates via Shippo API
- Integrated label generation
- Automatic tracking number assignment
- Worldwide shipping supported

**Shipping Cost**:
- Calculated at checkout based on destination
- Real-time USPS rates via Shippo

### Tax

**Automatic Calculation**:
- Stripe Tax API
- Calculated at checkout
- Stored per order item (for accounting)
- 0.5% of tax collected (Stripe fee)

### Reviews

**Eligibility**:
- After delivery only
- Verified buyers only (must have received order)

**Content**:
- Star rating (1-5)
- Text comment (required)
- Delivery accuracy: "Did it arrive on time?" (yes/no)
- No customer photo uploads

**Moderation**:
- Artisan can hide reviews (select reason)
- Artisan can ban user from future reviews
- Artisan can respond publicly to reviews

### Discount Codes

**Artisan Management**:
- Artisan creates codes via dashboard
- Types: percent off (10%) or fixed amount ($5)
- One-time use only (usage_limit = 1)
- Optional expiration date
- Track usage (code_id, order_id, used_at)

**Application**:
- Customer enters code at checkout
- Validates: not expired, not used, usage limit not reached
- Discount applied to subtotal (before tax and shipping)

### Messages

**Order Messages**:
- Threaded chat on order detail page
- Customer ↔ artisan conversation
- Artisan notification preferences (instant, digest, dashboard only)

**Contact Form**:
- General messages (no order required)
- Stored separately (type = 'contact')
- Artisan sees in unified messages inbox

**Customer View**:
- Unified "Messages" inbox
- Shows both order messages and contact form messages
- Filter by type

### Favorites

**Features**:
- Bookmark projects for later
- Shareable wishlist URL (public)
- Notifications when favorited project:
  - Delivery time shortens
  - Goes on sale (future feature)
  - Capacity opens (if was full)

### Artisan Dashboard

**Landing Page**:
- Metrics overview cards:
  - Today's revenue
  - Pending orders count
  - Queue capacity utilization %
  - Low stock alerts
- Quick actions (create project, view orders, etc.)

**Kanban Board**:
- Columns: pending_payment, paid, in_queue, in_production, shipped, delivered, cancelled, refunded
- Drag-and-drop to reorder queue or change status
- Filter by date range, customer, project type

**Customer Management**:
- Full customer list with search (name, email)
- Customer detail view:
  - Order history
  - Reviews given
  - Favorites
  - Total spent
  - Message history
- Reset customer password
- View/edit customer profile

**Analytics**:
- Revenue charts (daily, weekly, monthly)
- Popular projects (by sales, by favorites)
- Queue saturation over time
- Customer acquisition metrics
- Average order value
- Repeat customer rate

**Bulk Actions**:
- Select multiple orders
- Mark as shipped (with tracking numbers)
- Send template email to customers
- Export to CSV (for shipping labels)

**Email Customer**:
- Template-based emails
- Templates: "Order delayed", "Custom request", "Thank you"
- Artisan can customize before sending

**Inventory Alerts**:
- Email when merch stock drops below threshold
- Dashboard badge for low-stock items

---

## Milestone Roadmap

### v0.1.0 - Foundation [IN PROGRESS]

**Goal**: Repository structure, documentation, and planning complete. Ready to start building.

**Completed**:
- [x] Repository structure and tooling
- [x] Documentation framework
- [x] Project vision and domain model
- [x] ADR-001: Queue system
- [x] ADR-002: Technology stack (Cloudflare)
- [x] ADR-003: Infrastructure as Code (Terraform)
- [x] ADR-004: Database (D1)
- [x] ADR-005: Adapter architecture
- [x] ADR-006: Next.js App Router
- [x] Initial user stories (US-001)
- [x] Comprehensive roadmap with all decisions

**Remaining**:
- [ ] Create monorepo structure (apps/, packages/, migrations/, terraform/)
- [ ] Initialize Next.js app with Tailwind + shadcn/ui
- [ ] Initialize Hono Workers API
- [ ] Create adapter interfaces (EmailProvider, ShippingProvider, etc.)
- [ ] Create mock/inmemory adapters for testing
- [ ] Initialize Drizzle schema (User, Project, Order tables)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure SLSA provenance generation
- [ ] Configure Dependabot
- [ ] Set up Git Flow branches (main, develop)
- [ ] Write development environment setup guide
- [ ] Verify `pnpm run dev` starts all services

**Done When**: 
- New contributor can clone repo, run `pnpm install && pnpm run dev`, and see Next.js + Hono running
- Tests pass (`pnpm test`)
- CI pipeline runs successfully on PR
- Can inject mock EmailProvider and write a test

**Estimated Time**: 1-2 weeks

---

### v0.2.0 - Authentication & User Management

**Goal**: Customers can create accounts and sign in. Role-based access control in place.

**Features**:
- [ ] User registration (email input only)
- [ ] Magic link generation (JWT with 15min expiry)
- [ ] Email sending via EmailProvider (mock locally, Resend in prod)
- [ ] Magic link verification endpoint
- [ ] JWT session token (24hr expiry, httpOnly cookie)
- [ ] User profile CRUD (name, email, phone, default address)
- [ ] Role-based middleware (customer, artisan, super_admin)
- [ ] Email preference management (granular per-event)
- [ ] Geographic restriction middleware (Utah IP for artisan)
- [ ] Rate limiting middleware (sensitive operations)

**Database**:
- [ ] users table (multi-tenant)
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

### v0.3.0 - Core Entities (Projects & Patterns)

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

### v0.4.0 - Queue System (Core Differentiator)

**Goal**: The core differentiator - queue-based production capacity management.

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

### v0.5.0 - Shopping Cart & Orders

**Goal**: Customers can add items to cart and place orders (without payment yet).

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

### v0.6.0 - Payment Integration

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

### v0.7.0 - Shipping & Tax

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

### v0.8.0 - Artisan Tools

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

### v0.9.0 - Merch & Inventory

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

### v1.0.0 - Reviews, Polish & Launch

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
  - [ ] Purchase artisan-commerce.com
  - [ ] Configure DNS (Cloudflare)
  - [ ] Email setup (@artisan-commerce.com via Resend)
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

## Post-MVP Backlog (v1.1+)

### High Priority

**Custom Sizing (Made-to-Measure)** - PROMOTED TO v1.0
- Text field in order options
- Example: "Chest: 42in, Length: 28in"

**Analytics Dashboard Enhancements**
- More detailed charts
- Export to CSV
- Custom date ranges
- Comparison views (this month vs last month)

**Email When Capacity Opens**
- Waitlist notifications
- Automatic emails when queue has room
- Unsubscribe option

**Pattern-to-Product Upsell Enhancements**
- "Make it yourself or order one made" integration
- Bundle discounts
- Pattern + project combos

### Medium Priority

**Subscription Queue**
- Members get priority in queue
- Monthly subscription fee
- Skip-the-line benefit

**Community Page**
- User-submitted projects using patterns
- Photo gallery
- Social proof

**Gift Orders**
- Ship to different address
- Gift message
- Hide prices on packing slip

**Multi-Artisan Support**
- Hire help for fulfillment
- Assign orders to specific artisan
- Track who made what

### Low Priority

**Social Media Integration**
- Share projects on Pinterest, Instagram
- Social login (Google, Facebook)

**Referral Program**
- Give $10, get $10
- Track referrals
- Automatic discount codes

**Loyalty Points**
- Earn points on purchases
- Redeem for discounts

**PWA (Progressive Web App)**
- Offline pattern access
- Install on home screen
- Push notifications

### White-Label SaaS (Long-term Vision)

**Multi-Tenancy Features**:
- Tenant signup and onboarding
- Billing and subscription system
- Subdomain routing (artisan.yoursaas.com)
- Custom domain support
- Tenant isolation (already designed in v1.0)

**Self-Service**:
- Artisan can sign up and configure
- Payment processing setup wizard
- Branding customization
- Email template editor

**Documentation**:
- How to deploy your own instance
- White-label deployment guide
- API documentation for extensions

---

## How to Use This Document

**For Engineers**:
- Reference this for all architectural decisions
- Update as decisions change
- Link to specific sections in code comments
- Use as source of truth for requirements

**For Artisan**:
- Understand what features are coming
- Provide feedback on business rules
- Track progress through milestones

**For Contributors**:
- Read before starting work
- Understand the vision and principles
- Follow the established patterns
- Update docs when making changes

**Maintenance**:
- Keep in sync with ADRs
- Update as milestones complete
- Add new decisions as they're made
- Archive completed milestones

---

## Related Documents

- [ADRs](./decisions/) - Architecture decision records
- [User Stories](./stories/) - Detailed user stories with acceptance criteria
- [Vision](./vision.md) - Original ChatGPT brainstorming session
- [CHANGELOG](../CHANGELOG.md) - What shipped in each release
- [Architecture](../docs/03-architecture.md) - Architectural principles
- [Testing](../docs/05-testing.md) - Testing philosophy and strategy
- [Git Workflow](../docs/07-git-workflow.md) - Branching and commit conventions
