# Roadmap

This document tracks what we're building, why, and in what order.

**Last Updated**: 2026-03-05 | **Current Milestone**: v0.3.0 Auth & User Management -- Frontend

---

## Quick Navigation

- [Vision](#vision)
- [Milestones](#milestones)
- [Backlog](#backlog)
- [Reference](#reference)

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| [x] | Complete |
| [/] | In progress |
| [ ] | Planned |

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

- Web-only with mobile-responsive design
- No native mobile apps planned
- Mobile-first design approach
- Touch-friendly UI for tablets/phones

### Timeline

- **Target**: 9-12 months to v1.0 full launch
- **No hard deadline**: Quality over speed
- **Approach**: Full launch with all features (no soft launch)

---

## Milestones

---

## v0.1.0 -- Foundation [x]

**Goal**: Repository structure, tooling, and documentation in place. Ready to build.

- [x] Monorepo structure (apps/, packages/)
- [x] SvelteKit app initialized
- [x] Hono Workers API initialized
- [x] Drizzle schema: users, projects, orders, queue tables
- [x] Initial migration
- [x] Adapter interfaces: EmailProvider, StorageProvider
- [x] InMemory adapters for testing
- [x] CI/CD pipeline (GitHub Actions)
- [x] Dependabot configured
- [x] Development environment guide (mise.toml); `mise run dev` starts all services
- [x] Example unit test (EmailProvider)
- [x] Example integration test (health endpoint)
- [x] Example E2E test (homepage)
- [x] ADRs 001-006 written
- [x] Project vision, domain model, business rules documented

**Done When**: Clone + `mise run setup && mise run dev` works; tests pass; CI green.

---

## v0.2.0 -- Auth & User Management -- API [x]

**Goal**: Magic link auth, JWT sessions, RBAC, and user profile CRUD. Backend only; all behavior covered by integration tests.

**Known limitations**:
- Sessions are stateless JWTs -- no server-side revocation
- Rate limiting is in-memory per Worker instance -- no cross-instance coordination
- Artisan account pre-seeded via DB only -- no registration API

**Auth package** (`packages/shared/src/auth/`):
- [x] `signMagicLinkToken` / `verifyMagicLinkToken`
- [x] `signSessionToken` / `verifySessionToken`
- [x] `AuthError` with `code: 'EXPIRED' | 'INVALID' | 'MISSING'`
- [x] Token type discrimination (magic link token rejected as session)
- [x] Unit tests: 12 passing

**Config** (`apps/api/src/config.ts`):
- [x] `parseAuthConfig`, `parseGeoConfig`, `parseRateLimitConfig` -- production builders
- [x] `authConfigFromOptions`, `geoConfigFromOptions`, `rateLimitConfigFromOptions` -- test builders
- [x] `buildMagicLinkUrl` pure helper
- [x] `DEFAULTS` -- single source for all default values

**API factory** (`apps/api/src/index.ts`):
- [x] `Bindings`, `Variables`, `AppEnv`, `CreateAppOptions` types
- [x] `createApp(opts?)` with test injection support
- [x] Startup middleware resolves all config into `c.var` once; no `c.env` reads in routes or middleware

**Middleware**:
- [x] `auth.ts` -- `requireAuth`
- [x] `role.ts` -- `requireRole(role)`
- [x] `geo.ts` -- `requireUtahIp`
- [x] `rate-limit.ts` -- `createRateLimitMiddleware(store?)`, injectable `BucketStore`

**Routes**:
- [x] `POST /api/auth/register` -- upsert user, send magic link, always 200
- [x] `GET /api/auth/verify?token=` -- verify magic link, set httpOnly session cookie
- [x] `POST /api/auth/logout` -- clear session cookie
- [x] `GET /api/auth/me` -- requires auth, returns profile
- [x] `GET /api/users/me` -- requires auth, returns full profile
- [x] `PATCH /api/users/me` -- requires auth, accepts name/phone/defaultAddress

**Adapter cleanup**:
- [x] `SentEmailStore` interface + `InMemoryEmailStore` class separated from `InMemoryEmailProvider`
- [x] `InMemoryEmailProvider` accepts injected store; no inspection methods on provider
- [x] `InMemoryStorageProvider` refactored with same store/provider split
- [x] `resend.provider.ts` unused `params` -> `_params`
- [x] Non-existent `./payment`, `./shipping`, `./tax` exports removed from `packages/adapters/package.json`

**Architectural cleanup**:
- [x] Canonical `Role` type in `packages/shared/src/types/index.ts`; duplicates removed from `index.ts` and `role.ts`
- [x] Canonical `Address` type in `packages/shared/src/types/index.ts`; duplicates removed from schema and `routes/users.ts`
- [x] `rate-limit.ts` -- change `from '@artisan-commerce/api'` to relative `../index`
- [x] `geo.ts` -- use `config.allowedRegion` instead of hardcoded `'UT'`
- [x] `jwt.ts` -- replace fragile `constructor.name` check with proper type guard
- [x] `hono` moved to `dependencies` in `packages/shared/package.json`
- [x] `better-sqlite3` moved to `dependencies` in `packages/db/package.json`
- [x] `tests/helpers/db.ts` -- auto-discover migration files; remove hardcoded list
- [x] `tests/helpers/auth.ts` -- extract `loginAndGetCookie`; remove duplication
- [x] Magic link expiry text in email body uses actual config value, not hardcoded "15 minutes"
- [x] CORS origins moved to config; removed hardcoded values in `index.ts`

**tsconfig cleanup**:
- [x] Root `tsconfig.json` -- removed emit-only options (`composite`, `incremental`, `declaration`, `declarationMap`, `sourceMap`) irrelevant to `--noEmit` type-checking
- [x] All package tsconfigs -- removed `outDir`, `references`, and redundant `paths`; rely on workspace symlinks + `moduleResolution: bundler`
- [x] `packages/adapters/tsconfig.json` -- fixed pre-existing `rootDir` incompatibility; fixed Resend SDK field names (`reply_to` -> `replyTo`, `content_type` -> `contentType`, batch response shape)
- [x] `packages/db/tsconfig.json` -- added `types: ["@cloudflare/workers-types"]` to resolve `D1Database`

**Tests**:
- [x] Unit: JWT helpers (12 tests)
- [x] Integration: auth flow (12 tests)
- [x] Integration: user profile CRUD (7 tests)
- [x] Integration: health endpoint (2 tests)

**Done When**: All tests pass; lint clean; no hardcoded values; no duplicate types; no `biome-ignore` comments.

---

## v0.3.0 -- Auth & User Management -- Frontend [ ]

**Goal**: SvelteKit pages for register, verify, and profile. Auth-aware nav. E2E tests.

- [ ] `apps/web/src/lib/api.ts` -- typed fetch wrapper, `credentials: 'include'`
- [ ] `/auth/register` -- email input form, success confirmation message
- [ ] `/auth/verify` -- server-side load: calls API verify endpoint, redirects to /profile on success
- [ ] `/profile` -- server load redirects to /register if 401; form action updates name/phone/address
- [ ] `+layout.server.ts` -- calls `GET /api/auth/me`, passes user to layout
- [ ] `+layout.svelte` -- nav shows login link when unauthed, name + logout when authed
- [ ] E2E: register -> check email -> verify -> profile redirect
- [ ] E2E: unauthenticated /profile redirects to /register
- [ ] E2E: profile update persists

**Done When**: Full auth flow works end-to-end in browser; E2E tests pass; no Tailwind/shadcn yet (plain HTML).

---

## v0.4.0 -- Design System [ ]

**Goal**: Install Tailwind CSS + shadcn-svelte. Reskin all existing pages with the design system.

- [ ] Install and configure Tailwind CSS in `apps/web`
- [ ] Install and configure shadcn-svelte
- [ ] Reskin `/auth/register` page
- [ ] Reskin `/auth/verify` page
- [ ] Reskin `/profile` page
- [ ] Reskin layout nav (desktop + mobile)
- [ ] Base typography, color tokens, spacing documented
- [ ] Visual regression: all E2E tests still pass

**Done When**: All pages use Tailwind + shadcn components; E2E tests still pass; consistent visual baseline established.

---

## v0.5.0 -- Projects API [ ]

**Goal**: Artisan can create and manage projects with options and pricing. API and tests only.

**Database**:
- [ ] `projects` table (title, description, base price, queue tier, enabled, artisan id)
- [ ] `project_images` table (url, sort order)
- [ ] `project_options` table (name, type, values, price modifier, dependencies)

**Routes**:
- [ ] `POST /api/projects` -- artisan only; create project
- [ ] `GET /api/projects` -- public; list enabled projects (paginated, filterable)
- [ ] `GET /api/projects/:id` -- public; project detail with options and images
- [ ] `PATCH /api/projects/:id` -- artisan only; update project
- [ ] `DELETE /api/projects/:id` -- artisan only; soft delete (disable)
- [ ] `POST /api/projects/:id/images` -- artisan only; add image URL
- [ ] `DELETE /api/projects/:id/images/:imageId` -- artisan only

**Business rules**:
- [ ] Pricing: base price + sum of selected option modifiers
- [ ] Option dependencies: option B only shown when option A has value X
- [ ] Queue tier validated against 5 allowed tiers (XSmall through XLarge)

**Tests**:
- [ ] Unit: pricing calculation, option dependency validation
- [ ] Integration: full CRUD, auth enforcement, filtering

**Done When**: All routes tested; pricing and option logic unit tested; artisan-only routes reject customers.

---

## v0.6.0 -- Projects UI [ ]

**Goal**: Artisan can manage projects from a dashboard. Customers can browse and view project detail.

- [ ] `/artisan/projects` -- list with enable/disable toggle, edit/delete actions
- [ ] `/artisan/projects/new` -- create form (title, description, price, tier, options, images)
- [ ] `/artisan/projects/:id/edit` -- edit form
- [ ] `/projects` -- customer gallery: grid, filter by option/tier, sort by price/newest
- [ ] `/projects/:id` -- customer detail: images, options selector, price preview, queue estimate placeholder
- [ ] Image upload: client-side resize before upload to storage adapter
- [ ] E2E: artisan creates project, customer views it

**Done When**: Artisan can manage 10-20 projects; customers can browse and filter; E2E tests pass.

---

## v0.7.0 -- Patterns API [ ]

**Goal**: Artisan can create patterns (PDF + preview image) and link them to projects. API and tests only.

**Database**:
- [ ] `patterns` table (title, description, pdf_url, preview_url, enabled, artisan id)
- [ ] `project_patterns` join table (bidirectional link)

**Routes**:
- [ ] `POST /api/patterns` -- artisan only; create pattern (pdf_url, preview_url)
- [ ] `GET /api/patterns` -- public; list enabled patterns
- [ ] `GET /api/patterns/:id` -- public; pattern detail with linked projects
- [ ] `PATCH /api/patterns/:id` -- artisan only; update
- [ ] `DELETE /api/patterns/:id` -- artisan only; soft delete
- [ ] `PUT /api/patterns/:id/projects` -- artisan only; set linked projects (replaces list)

**Tests**:
- [ ] Integration: full CRUD, auth enforcement, bidirectional project links

**Done When**: All routes tested; bidirectional links work both ways.

---

## v0.8.0 -- Patterns UI [ ]

**Goal**: Artisan can manage patterns. Customers can browse and view pattern detail.

- [ ] `/artisan/patterns` -- list with enable/disable toggle, edit/delete actions
- [ ] `/artisan/patterns/new` -- create form (title, description, PDF upload, preview, link projects)
- [ ] `/artisan/patterns/:id/edit` -- edit form
- [ ] `/patterns` -- customer gallery: grid, filter, sort
- [ ] `/patterns/:id` -- customer detail: preview, download link (auth required), linked projects
- [ ] PDF upload stored via StorageProvider adapter
- [ ] E2E: artisan creates pattern linked to project, customer views both

**Done When**: Artisan can upload and manage patterns; customers can preview and access linked projects; E2E tests pass.

---

## v0.9.0 -- Favorites [ ]

**Goal**: Customers can favorite projects and patterns. Artisan can see counts.

**Database**:
- [ ] `favorites` table (user id, target type, target id, created at)

**Routes**:
- [ ] `POST /api/favorites` -- auth required; toggle favorite (adds or removes)
- [ ] `GET /api/favorites` -- auth required; list current user's favorites
- [ ] `GET /api/users/:id/favorites` -- public wishlist (shareable URL)
- [ ] Favorite counts returned on `GET /api/projects/:id` and `GET /api/patterns/:id`

**UI**:
- [ ] Favorite heart button on project and pattern cards/detail pages
- [ ] `/favorites` -- customer wishlist page (own + shared view)
- [ ] Artisan sees favorite counts on project management list

**Tests**:
- [ ] Integration: toggle, list, counts, public wishlist
- [ ] E2E: customer favorites a project, visits wishlist, shares URL

**Done When**: Favorites toggle works; counts visible; wishlist URL shareable without login.

---

## v0.10.0 -- Queue Engine [ ]

**Goal**: Core queue algorithm: 5-tier weight system, delivery estimates, capacity config. API and tests only.

**Database**:
- [ ] `queue_config` table (weekly_capacity, paused, updated_at) -- single row
- [ ] `queue_entries` table (order id, tier, weight, position, status, estimated_delivery)

**Routes**:
- [ ] `GET /api/queue/config` -- artisan only; current capacity config
- [ ] `PATCH /api/queue/config` -- artisan only; update capacity or toggle pause
- [ ] `GET /api/queue/estimate?tier=` -- public; estimated delivery for a given tier
- [ ] Queue entry created automatically when order is paid (used in v0.13.0)

**Business rules**:
- [ ] 5 tiers: XSmall=1, Small=2, Medium=3, Large=5, XLarge=8 (weight units)
- [ ] Delivery estimate = sum of weights ahead / weekly_capacity (in weeks), rounded up
- [ ] Paused queue shows no estimate, blocks new orders
- [ ] Position recalculated on any queue change

**Tests**:
- [ ] Unit: weight calculation, delivery estimate, edge cases (empty queue, paused, cancellations)
- [ ] Integration: config CRUD, estimate endpoint, position updates

**Done When**: Algorithm unit tested with edge cases; estimate endpoint returns correct values; artisan can pause queue.

---

## v0.11.0 -- Queue UI [ ]

**Goal**: Artisan queue Kanban dashboard. Customer sees position and estimate. Waitlist when full.

- [ ] `/artisan/queue` -- Kanban board: columns by status, drag-and-drop reorder
- [ ] `/artisan/queue/config` -- set weekly capacity, pause button, utilization meter
- [ ] Delivery estimate displayed on `/projects/:id` (uses `GET /api/queue/estimate`)
- [ ] Order detail shows queue position and estimated delivery date
- [ ] Waitlist signup form when queue is paused or capacity full
- [ ] Email notification to waitlist when capacity reopens (via EmailProvider)
- [ ] E2E: artisan reorders queue, customer sees updated estimate

**Done When**: Artisan can manage queue from Kanban; customers see estimates; waitlist email works.

---

## v0.12.0 -- Cart & Orders API [ ]

**Goal**: Shopping cart, order creation, and order lifecycle state machine. API and tests only.

**Database**:
- [ ] `cart_items` table (user id, project id, options snapshot, quantity)
- [ ] `orders` table (user id, status, total, address snapshot, modification_deadline)
- [ ] `order_items` table (order id, project id, options snapshot, price snapshot, quantity, tier)

**Routes**:
- [ ] `GET /api/cart` -- auth required; current cart
- [ ] `POST /api/cart` -- auth required; add item
- [ ] `PATCH /api/cart/:itemId` -- auth required; update quantity or options
- [ ] `DELETE /api/cart/:itemId` -- auth required; remove item
- [ ] `POST /api/orders` -- auth required; create order from cart, calculate total
- [ ] `GET /api/orders` -- auth required; order history (customer sees own; artisan sees all)
- [ ] `GET /api/orders/:id` -- auth required; order detail
- [ ] `PATCH /api/orders/:id` -- customer modify within window; artisan modify anytime
- [ ] `DELETE /api/orders/:id` -- cancel; $15 fee after modification window

**Business rules**:
- [ ] Order lifecycle: pending -> paid -> in_production -> shipped -> delivered; also: cancelled, refunded, disputed
- [ ] 12-hour free modification window from order creation (configurable via env)
- [ ] Artisan can extend modification window per order
- [ ] Cancellation after window: $15 flat fee applied
- [ ] Price and options snapshot at order creation (immune to future project edits)

**Tests**:
- [ ] Unit: lifecycle transitions, modification window, cancellation fee
- [ ] Integration: cart CRUD, order creation, modification, cancellation

**Done When**: All routes tested; lifecycle transitions enforced; window and fee logic unit tested.

---

## v0.13.0 -- Orders UI [ ]

**Goal**: Cart UI, checkout, order history, modification and cancellation flows.

- [ ] `/cart` -- cart page: item list, quantity controls, pattern bundle upsell, proceed to checkout
- [ ] `/checkout` -- address form, order summary, place order button (no payment yet -- payment in v0.15.0)
- [ ] `/orders` -- order history list
- [ ] `/orders/:id` -- order detail: status, items, queue position, estimated delivery, modification/cancel actions
- [ ] Modification UI: change options or quantity within window
- [ ] Cancellation UI: confirm dialog with fee warning if outside window
- [ ] E2E: add to cart -> checkout -> view order -> modify -> cancel

**Done When**: Full cart-to-order flow works without payment; E2E tests pass.

---

## v0.14.0 -- Messaging [ ]

**Goal**: Threaded order messages between customer and artisan. General contact form.

**Database**:
- [ ] `messages` table (order id nullable, sender id, body, created at, read at)

**Routes**:
- [ ] `GET /api/orders/:id/messages` -- auth required; thread for order
- [ ] `POST /api/orders/:id/messages` -- auth required; send message in thread
- [ ] `POST /api/messages` -- auth required; general contact (no order)
- [ ] `GET /api/messages/inbox` -- artisan only; all unread threads

**UI**:
- [ ] Order detail page includes message thread
- [ ] `/artisan/messages` -- unified inbox: all threads, unread badge
- [ ] `/contact` -- public contact form (requires login)
- [ ] Email notification to artisan on new customer message (via EmailProvider)

**Tests**:
- [ ] Integration: send/receive, inbox, unread counts
- [ ] E2E: customer sends message on order, artisan reads in inbox

**Done When**: Messages work on orders and as general contact; artisan inbox works; email notification sent.

---

## v0.15.0 -- Payments [ ]

**Goal**: Stripe checkout integration. Orders paid and queue entries created automatically.

**Adapter**:
- [ ] `PaymentProvider` interface in `packages/adapters/src/payment/types.ts`
- [ ] `InMemoryPaymentProvider` for testing
- [ ] `StripePaymentProvider` implementation

**Routes**:
- [ ] `POST /api/orders/:id/checkout` -- create Stripe Checkout session; return redirect URL
- [ ] `GET /api/orders/:id/checkout/success` -- verify payment, mark order paid, create queue entry
- [ ] `GET /api/orders/:id/checkout/cancel` -- return to order detail
- [ ] `POST /api/webhooks/stripe` -- handle payment_intent.succeeded, charge.refunded; verify signature

**UI**:
- [ ] Checkout button on `/checkout` triggers Stripe hosted checkout
- [ ] Success page: order confirmed, queue position shown
- [ ] Cancel page: return to cart

**Tests**:
- [ ] Unit: webhook signature verification, payment state transitions
- [ ] Integration: checkout session creation, webhook handling (InMemoryPaymentProvider)
- [ ] E2E: full checkout flow (Stripe test mode)

**Done When**: Customers can complete real purchases; order marked paid; queue entry created; webhooks verified.

---

## v0.16.0 -- Discounts [ ]

**Goal**: Artisan can create discount codes; customers apply them at checkout.

**Database**:
- [ ] `discount_codes` table (code, type: percent|fixed, amount, max_uses, uses, expires_at, enabled)
- [ ] `discount_code_usage` table (code id, order id, user id, applied_at)

**Routes**:
- [ ] `POST /api/discount-codes` -- artisan only; create code
- [ ] `GET /api/discount-codes` -- artisan only; list all codes with usage stats
- [ ] `PATCH /api/discount-codes/:id` -- artisan only; enable/disable, update
- [ ] `POST /api/discount-codes/validate` -- auth required; validate code, return discount amount
- [ ] Discount applied at order creation; stored on order

**UI**:
- [ ] `/artisan/discounts` -- code management: create, list, toggle, usage counts
- [ ] Discount code input on checkout page; live validation and preview

**Tests**:
- [ ] Unit: percent vs fixed calculation, one-time use enforcement, expiry
- [ ] Integration: create, validate, apply, usage tracking
- [ ] E2E: artisan creates code, customer applies at checkout

**Done When**: Codes create, validate, and apply correctly; one-time use enforced; artisan can track usage.

---

## v0.17.0 -- Shipping [ ]

**Goal**: Shipping rate calculation and label generation via Shippo. Order auto-marked shipped.

**Adapter**:
- [ ] `ShippingProvider` interface in `packages/adapters/src/shipping/types.ts`
- [ ] `InMemoryShippingProvider` for testing
- [ ] `ShippoShippingProvider` implementation

**Database**:
- [ ] `shipping_labels` table (order id, carrier, tracking number, label_url, created_at)

**Routes**:
- [ ] `POST /api/orders/:id/shipping/rates` -- artisan only; get live rates for order
- [ ] `POST /api/orders/:id/shipping/label` -- artisan only; purchase label, store tracking, mark shipped
- [ ] `GET /api/orders/:id/shipping` -- auth required; tracking info

**UI**:
- [ ] Order detail (artisan view): shipping rates panel, create label button
- [ ] Label PDF download link after creation
- [ ] Tracking number shown to customer on order detail
- [ ] Bulk shipping: select multiple orders, create labels in batch
- [ ] Export shipping manifest to CSV

**Tests**:
- [ ] Unit: rate parsing, label state transitions
- [ ] Integration: rate fetch, label creation, tracking (InMemoryShippingProvider)
- [ ] E2E: artisan creates label, order marked shipped, customer sees tracking

**Done When**: Artisan can get rates, buy labels, and ship orders; customer sees tracking; bulk actions work.

---

## v0.18.0 -- Tax [ ]

**Goal**: Automatic tax calculation at checkout via Stripe Tax.

**Adapter**:
- [ ] `TaxCalculator` interface in `packages/adapters/src/tax/types.ts`
- [ ] `InMemoryTaxCalculator` (flat rate for testing)
- [ ] `StripeTaxCalculator` implementation

**Routes**:
- [ ] Tax calculated and stored per order item at checkout session creation
- [ ] `GET /api/orders/:id/tax` -- auth required; tax breakdown

**UI**:
- [ ] Tax line item shown in order summary at checkout
- [ ] Tax breakdown on order detail and receipt

**Tests**:
- [ ] Unit: tax calculation, per-item breakdown
- [ ] Integration: tax applied at checkout (InMemoryTaxCalculator)

**Done When**: Tax calculated automatically; stored per order item; shown at checkout and on receipts.

---

## v0.19.0 -- Artisan Dashboard [ ]

**Goal**: Artisan landing page with key metrics, order management, and bulk actions.

- [ ] `/artisan` -- dashboard: revenue (week/month), pending orders count, queue utilization, low stock alerts
- [ ] `/artisan/orders` -- full order list: search by customer/email/order ID, filter by status
- [ ] Order detail (artisan): status update, production time override, cancel with optional refund
- [ ] Bulk actions: select orders, update status, export CSV
- [ ] Email customer from order detail (template: status update, custom message)

**Tests**:
- [ ] Integration: search, bulk status update, CSV export
- [ ] E2E: artisan views dashboard, manages orders, sends email

**Done When**: Artisan can manage day-to-day order operations from one place; bulk actions work; email sends.

---

## v0.20.0 -- Artisan Analytics [ ]

**Goal**: Revenue trends, popular projects, queue saturation over time.

**Database**:
- [ ] `daily_stats` table (date, revenue, orders, queue_utilization) -- computed nightly
- [ ] `project_stats` table (project id, total_sales, total_favorites, last_updated)

**Routes**:
- [ ] `GET /api/artisan/analytics/revenue?period=` -- daily/weekly/monthly revenue
- [ ] `GET /api/artisan/analytics/projects` -- sorted by sales and favorites
- [ ] `GET /api/artisan/analytics/queue` -- queue saturation over time

**UI**:
- [ ] `/artisan/analytics` -- revenue chart (line, switchable period), popular projects table, queue saturation chart
- [ ] Customer acquisition metric (new vs returning)

**Tests**:
- [ ] Unit: stat aggregation logic
- [ ] Integration: analytics endpoints with seeded data

**Done When**: Artisan sees accurate revenue, popular projects, and queue trends; charts render correctly.

---

## v0.21.0 -- Customer Management [ ]

**Goal**: Artisan can browse and manage customer accounts.

- [ ] `/artisan/customers` -- searchable customer list (name, email, order count, total spent)
- [ ] `/artisan/customers/:id` -- detail: order history, favorites, messages, total spent
- [ ] Reset customer magic link (send new link on behalf of customer)
- [ ] Ban/unban customer (blocks login and new orders)

**Tests**:
- [ ] Integration: customer list, search, ban enforcement
- [ ] E2E: artisan bans customer, customer cannot log in

**Done When**: Artisan can find, review, and manage customer accounts.

---

## v0.22.0 -- Merch & Inventory [ ]

**Goal**: Artisan sells inventory-based merch alongside handmade queue items.

**Database**:
- [ ] `merch` table (title, description, price, stock_quantity, images, enabled)

**Routes**:
- [ ] `POST /api/merch` -- artisan only; create merch item
- [ ] `GET /api/merch` -- public; list enabled merch
- [ ] `GET /api/merch/:id` -- public; merch detail
- [ ] `PATCH /api/merch/:id` -- artisan only; update including stock quantity
- [ ] `DELETE /api/merch/:id` -- artisan only; soft delete

**Business rules**:
- [ ] Stock decremented on order; restored on cancellation/refund
- [ ] Out-of-stock: show badge, block add-to-cart, allow waitlist signup
- [ ] Merch and handmade items ship together in same order
- [ ] Low-stock threshold alert (email to artisan + dashboard badge)

**UI**:
- [ ] `/artisan/merch` -- manage inventory, stock levels, alerts
- [ ] `/merch` -- customer gallery
- [ ] `/merch/:id` -- customer detail, out-of-stock handling
- [ ] Mixed cart works seamlessly

**Tests**:
- [ ] Unit: stock decrement, out-of-stock logic
- [ ] Integration: CRUD, mixed orders, low-stock alert
- [ ] E2E: artisan creates merch, customer adds to cart with handmade item

**Done When**: Merch sells correctly alongside queue items; inventory tracked; alerts fire.

---

## v0.23.0 -- Reviews [ ]

**Goal**: Verified buyers leave reviews. Artisan responds publicly. Moderation tools.

**Database**:
- [ ] `reviews` table (order id, user id, project id, rating, body, on_time, created at, hidden)
- [ ] `review_responses` table (review id, artisan id, body, created at)

**Routes**:
- [ ] `POST /api/reviews` -- auth required; verified buyer only (order status: delivered); one per order item
- [ ] `GET /api/projects/:id/reviews` -- public; paginated reviews with ratings summary
- [ ] `POST /api/reviews/:id/response` -- artisan only; public response
- [ ] `PATCH /api/reviews/:id` -- artisan only; hide review
- [ ] `DELETE /api/users/:id` -- artisan only; ban user (removes ability to review)

**UI**:
- [ ] Project detail: star rating summary + review list + artisan responses
- [ ] Post-delivery prompt on order detail: leave a review
- [ ] `/artisan/reviews` -- moderation: hide reviews, respond, see on-time delivery stats

**Tests**:
- [ ] Unit: verified buyer check, one-review-per-item enforcement
- [ ] Integration: create, respond, hide, ban
- [ ] E2E: customer reviews after delivery, artisan responds

**Done When**: Only verified buyers can review; artisan can respond and moderate; ratings show on projects.

---

## v0.24.0 -- Infrastructure & Deployment [ ]

**Goal**: Real Cloudflare deployment. Terraform manages infrastructure. Domain live.

- [ ] Terraform config for Cloudflare Workers, D1, R2, DNS
- [ ] Wrangler config complete for production deployment
- [ ] `mise run deploy` deploys API to Cloudflare Workers
- [ ] `mise run deploy:web` deploys SvelteKit to Cloudflare Pages
- [ ] D1 production database created; migrations run via CI
- [ ] R2 bucket created; StorageProvider wired to production bucket
- [ ] Domain purchased and DNS configured via Cloudflare
- [ ] Resend domain verified; production email sending works
- [ ] `apps/api/.dev.vars` documented and gitignored
- [ ] Environment variables documented in README
- [ ] CI deploys on merge to main

**Done When**: `https://yourdomain.com` loads the live app; API responds; email sends; CI deploys automatically.

---

## v0.25.0 -- Accessibility & i18n Scaffold [ ]

**Goal**: WCAG 2.1 AA compliance across all pages. i18n framework in place for future languages.

- [ ] Keyboard navigation works on all interactive elements
- [ ] Screen reader labels on all forms, buttons, and icons
- [ ] Color contrast passes AA on all text
- [ ] Focus indicators visible
- [ ] All images have alt text
- [ ] Touch targets >= 44x44px on mobile
- [ ] `TranslationProvider` interface in `packages/adapters`
- [ ] English JSON translation files for all UI strings
- [ ] Language switcher in nav (English only for now; ready for expansion)

**Tests**:
- [ ] Automated a11y scan with axe-core in Playwright E2E suite

**Done When**: axe-core reports zero violations; keyboard-only navigation works end-to-end; i18n scaffold in place.

---

## v0.26.0 -- Hardening [ ]

**Goal**: Security audit, graceful error handling, performance, and monitoring.

**Security**:
- [ ] OWASP Top 10 self-checklist completed
- [ ] Dependency audit (`npm audit`; Dependabot alerts resolved)
- [ ] Input validation tightened on all routes (Zod schemas reviewed)
- [ ] Rate limiting reviewed for production adequacy
- [ ] CSP headers configured

**Error handling**:
- [ ] All API errors return consistent `{ code, message }` shape
- [ ] 404 and 500 error pages in SvelteKit
- [ ] Graceful degradation when StorageProvider or EmailProvider is unavailable

**Performance**:
- [ ] Image lazy loading on gallery pages
- [ ] Route-based code splitting verified
- [ ] Delivery estimate caching (short TTL)
- [ ] Cloudflare cache headers on public routes

**Monitoring**:
- [ ] Cloudflare Workers analytics reviewed
- [ ] Error alerting: critical errors notify engineer via email
- [ ] Backup and restore drill documented and tested

**Done When**: OWASP checklist complete; no critical npm audit findings; error pages render; monitoring alerts configured.

---

## v1.0.0 -- Launch [ ]

**Goal**: Beta tested, documented, legally covered, and ready for real customers.

- [ ] Mobile device testing on real iPhone and Android
- [ ] All E2E tests passing (coverage >= 85%)
- [ ] 10-20 projects created and ready
- [ ] User documentation: guide, FAQ, shipping/returns policy
- [ ] Legal pages: Terms of Service, Privacy Policy, Cookie consent
- [ ] Beta test with 5-10 real users; feedback incorporated
- [ ] Engineer + artisan each personally completed every major flow at least 3 times
- [ ] CHANGELOG complete for all versions
- [ ] All `package.json` versions bumped to `1.0.0`
- [ ] Launch announcement prepared

**Done When**: Real customers can browse, order, pay, and receive items. Artisan can manage everything from the dashboard. Platform is stable, documented, and legally covered.

---

## Backlog

Ideas without a version. Promoted to a milestone when prioritized.

- Subscription queue: members get priority slots
- Community page: user-submitted projects using patterns
- Seasonal drops: limited ordering windows
- Limited pattern releases: scarcity-based launches
- Custom sizing: made-to-measure text field for measurements
- Gift orders with custom messages
- Multi-artisan support: hire help for fulfillment
- Social sharing: Pinterest and Instagram integration
- Referral program
- Loyalty points
- Progressive Web App (PWA) for offline pattern access
- White-label SaaS: multi-tenancy, tenant billing, custom domains

---

## Reference

### Technology Stack

**Frontend**: SvelteKit + Tailwind CSS + shadcn-svelte
**Backend**: Hono on Cloudflare Workers
**Database**: Drizzle ORM + Cloudflare D1 (SQLite)
**Storage**: Cloudflare R2 (S3-compatible)
**Email**: Resend (EmailProvider adapter)
**Payments**: Stripe (PaymentProvider adapter)
**Shipping**: Shippo (ShippingProvider adapter)
**Tax**: Stripe Tax (TaxCalculator adapter)
**Testing**: Vitest + Playwright
**CI/CD**: GitHub Actions
**IaC**: Terraform + Wrangler

**Cost**: ~$1-5/month (domain + transaction fees)

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

See [domain-model.md](../docs/domain-model.md) for full entity specifications.

### Business Rules

**Queue**: 5-tier weight system (XSmall=1 to XLarge=8), FIFO with manual reorder
**Orders**: 8 lifecycle states, 12-hour free modification window, $15 cancellation fee
**Pricing**: Simple additive modifiers (base + material + size + custom)
**Shipping**: USPS only (v1.0), calculated rates via Shippo
**Tax**: Automatic via Stripe Tax (0.5% fee)

See [business-rules.md](../docs/business-rules.md) for complete business logic.

---

## Related Documents

- [Business Rules](../docs/business-rules.md)
- [Domain Model](../docs/domain-model.md)
- [Stories](./stories/)
- [Decisions](./decisions/)
- [Vision](./vision.md)
- [CHANGELOG](../CHANGELOG.md)
- [Architecture](../docs/03-architecture.md)
- [Testing](../docs/05-testing.md)
- [Git Workflow](../docs/07-git-workflow.md)
