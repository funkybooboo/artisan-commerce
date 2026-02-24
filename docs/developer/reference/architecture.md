# Architecture

This document covers the architectural principles, technology stack, and design decisions for Artisan Commerce.

**Last Updated**: 2026-02-23

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Technology Stack](#technology-stack)
3. [Architectural Patterns](#architectural-patterns)
4. [Domain Model](#domain-model)
5. [Key Decisions](#key-decisions)

---

## Core Principles

### Cheap
- Stay on Cloudflare free tier as long as possible
- Transaction-based pricing only (Stripe, Shippo)
- Target: ~$1-5/month until 100+ orders/month

### Convenient
- Passwordless authentication (magic links)
- Beautiful artisan dashboard
- Mobile-first responsive design
- Modern developer experience

### Secure
- Geographic restriction (Utah IP for artisan access)
- Role-based access control
- Rate limiting on sensitive operations
- WCAG 2.1 AA accessibility compliance
- SLSA Level 3 supply chain security

### Portable
- Zero vendor lock-in via comprehensive adapter pattern
- Multi-database support (D1 → Postgres migration path)
- Framework portability (SvelteKit can deploy anywhere)
- Standard APIs and patterns

### Simple
- Straightforward frameworks (SvelteKit, TypeScript)
- Standard design patterns (Factory, DI, Repository)
- Comprehensive documentation
- Conventional project structure

---

## Technology Stack

### At a Glance

| Component | Technology | Cost | Why |
|-----------|-----------|------|-----|
| **Frontend** | SvelteKit + TypeScript | $0 | Simpler than React, smaller bundles, better DX |
| **Hosting** | Cloudflare Pages | $0 | Global CDN, auto-deploy from Git |
| **Backend API** | Hono on Cloudflare Workers | $0 | Serverless edge functions, 100k req/day free |
| **Database** | Cloudflare D1 (SQLite) | $0 | 5GB storage, 5M reads/day free |
| **File Storage** | Cloudflare R2 | $0 | S3-compatible, 10GB storage + egress/month free |
| **Email** | Resend | $0 | 3000 emails/month free |
| **Payments** | Stripe | Pay-per-use | 2.9% + $0.30 per transaction |
| **Shipping** | Shippo | Pay-per-use | $0.05 per label |
| **Tax** | Stripe Tax | Pay-per-use | 0.5% of tax collected |
| **IaC** | Terraform + Wrangler | $0 | Industry standard |
| **CI/CD** | GitHub Actions | $0 | 2000 minutes/month free |
| **Domain** | Registrar of choice | ~$10/year | .com domain |
| **TOTAL** | | **~$1/month** | Just the domain! |

### Architecture Overview

```
User Browser
    ↓
Cloudflare Global Network (200+ locations)
    ↓
├── Pages (Static Assets) → SvelteKit HTML/CSS/JS
├── Workers (API) → TypeScript serverless functions
│   ↓
│   ├── D1 (Database) → SQLite at the edge
│   ├── R2 (Files) → Product images, PDFs
│   └── KV (Sessions) → User sessions
└── External Services (via Adapters)
    ├── Stripe → Payment processing
    ├── Shippo → Shipping labels
    ├── Stripe Tax → Tax calculation
    └── Resend → Email delivery
```

**Key Characteristics:**
- **Serverless**: No servers to manage, auto-scales
- **Edge-first**: Runs globally, close to users
- **Cost-optimized**: Free tiers cover 100x expected traffic
- **Portable**: Adapters enable migration to any provider

### Frontend

**Framework**: SvelteKit
- Deployed to Cloudflare Pages
- Server-side rendering with edge functions
- Form actions for mutations (progressive enhancement)
- Route groups for organization

**Styling**: Tailwind CSS + shadcn-svelte
- Utility-first, mobile-first
- Copy-paste components (no dependency)
- Excellent accessibility

**Forms**: Native Svelte forms + Zod
- Type-safe validation
- Shared schemas (frontend + backend)

**State**: Svelte stores + URL state
- Reactive state via Svelte stores
- URL query params for shareable state
- Built-in reactivity (no hooks needed)

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

**Package Manager**: mise-managed dependencies
- Automatic tool installation
- Version consistency across team

**Testing**: TDD with Vitest + Playwright
- Unit tests: Vitest + Svelte Testing Library
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

---

## Architectural Patterns

### Separate What from How

The most important architectural decision: where to draw the line between **core logic** and **infrastructure**.

- **Core logic** is *what* your program does -- the rules, decisions, and transformations that make it valuable.
- **Infrastructure** is *how* it does it -- files, networks, databases, terminals, hardware, external services.

Core logic should not know about infrastructure. Infrastructure should be swappable without touching core logic.

### Ports and Adapters (Hexagonal Architecture)

Define **ports** (interfaces) and implement **adapters** (concrete implementations).

```
+----------------------------------------------+
|                                              |
|              Core Logic                      |
|       (rules, decisions, transforms)         |
|                                              |
|   depends on v interfaces, not details       |
|                                              |
|--------------+-------------------------------+
|   Storage    |   Logger   |   Clock   | ...  |  <- Ports (interfaces)
|--------------+-------------------------------+
|  Postgres  InMemory  File  Console  System   |  <- Adapters (implementations)
+----------------------------------------------+
```

**A port** is an interface -- a contract that describes a capability your core needs.

**An adapter** is a concrete implementation of a port. Multiple adapters per port:

| Port | Production adapter | Test adapter |
|------|--------------------|--------------|
| Storage | Database | In-memory map |
| Logger | Structured JSON | Silent / recording |
| Clock | System time | Fixed / controllable |
| EmailProvider | Resend | Mock/recording |
| PaymentProvider | Stripe | Mock/recording |
| ShippingProvider | Shippo | Mock/recording |

For Artisan Commerce:
- **EmailProvider** sends order confirmations, queue updates, shipping notifications
- **PaymentProvider** handles Stripe integration for checkout and refunds
- **ShippingProvider** calculates rates and generates labels
- **TaxCalculator** calculates sales tax
- **FileStorage** manages product images and pattern PDFs
- **QueueCalculator** implements capacity management algorithm

See [ADR-005](../plans/decisions/ADR-005-adapter-architecture.md) for complete adapter architecture.

### Dependency Injection

Wire adapters together in one place -- a composition root or `main` entry point.

```
main / container
  |-- creates Config  (reads from environment)
  |-- creates Logger  (uses Config for log level)
  |-- creates Storage (uses Config for connection string)
  `-- creates App     (receives Storage, Logger)
```

**Rules:**
- Construct dependencies once, at startup
- Pass them in -- don't reach out and grab them from globals
- The composition root is the only place that knows which concrete adapter is used

### 12-Factor Principles

1. **Config in the environment** -- no hardcoded values; read from env vars
2. **Explicit dependencies** -- declare everything; no ambient globals
3. **Stateless processes** -- don't store state in memory between invocations
4. **Logs to stdout** -- write log output as a stream of events
5. **One codebase, many environments** -- same code in dev, test, and production

See [12factor.net](https://12factor.net/) for the full list.

---

## Domain Model

### Single-Tenant Architecture

**One artisan business per application instance**:

- Each deployment serves a single artisan business
- No runtime multi-tenancy or tenant isolation needed
- Brand configuration via environment variables (.env)
- To serve multiple artisan businesses, fork the repository and deploy separate instances
- Database schema is simple - no tenant_id columns needed

**Example**: Your wife's shop "Bluebells & Thistles" runs on one instance. Another artisan "Cozy Crafts" would fork the repo and deploy their own instance.

### Core Entities

Artisan Commerce is built around these core entities:

- **User** -- Customers and artisans with role-based permissions
- **Project** -- Made-to-order handmade items (crochet, knitting, embroidery, etc.) with customizable options
- **Pattern** -- Digital or physical patterns that can be sold standalone or linked to projects
- **Order** -- Customer orders containing projects and/or patterns, with lifecycle states and queue position
- **Queue** -- Central production capacity management system that calculates delivery estimates
- **Merch** -- Brand merchandise with traditional inventory management (separate from handmade queue)

The queue system is the core differentiator -- it manages finite production capacity and provides transparent delivery estimates.

**For complete entity specifications**, see [domain-model.md](./domain-model.md).

---

## Key Decisions

### Architecture Decision Records

All significant architectural decisions are documented in ADRs in [`plans/decisions/`](../plans/decisions/).

**Core Decisions**:

1. **[ADR-001](../plans/decisions/ADR-001-example.md)**: Queue-Based Production Capacity Management
   - 5-tier weight system (XSmall=1 to XLarge=8)
   - FIFO with manual exceptions
   - Dynamic delivery estimates
   - Capacity limits with waitlist

2. **[ADR-002](../plans/decisions/ADR-002-tech-stack.md)**: Technology Stack - Cloudflare Serverless
   - SvelteKit + Cloudflare Pages
   - Hono on Cloudflare Workers
   - Drizzle ORM + D1 database
   - ~$1/month cost

3. **[ADR-003](../plans/decisions/ADR-003-infrastructure-as-code.md)**: Infrastructure as Code with Terraform
   - Terraform provisions resources
   - Wrangler deploys code and manages secrets
   - Git Flow branching (main/develop/feature/release)

4. **[ADR-004](../plans/decisions/ADR-004-database-cloudflare-d1.md)**: Database - Cloudflare D1
   - SQLite-as-a-service
   - Multi-tenant schema from start
   - Migration path to Postgres ready

5. **[ADR-005](../plans/decisions/ADR-005-adapter-architecture.md)**: Comprehensive Adapter Architecture
   - Zero vendor lock-in
   - All external services wrapped
   - Four test double types per adapter
   - Standard naming (EmailProvider, ResendEmailProvider)

6. **[ADR-006](../plans/decisions/ADR-006-sveltekit.md)**: SvelteKit for Simplicity and Edge Performance
   - Simpler mental model (less "magic")
   - Smaller bundles (50% less than React)
   - Excellent Cloudflare compatibility
   - Framework portability

### When to Write an ADR

Write an ADR when:
- Choosing between two non-obvious approaches
- Making a decision that will be hard to reverse
- Adopting or rejecting a technology, library, or pattern
- Establishing a convention others will follow

---

## What to Avoid

- **God objects** -- one class or module that knows everything and does everything
- **Hidden dependencies** -- global state, singletons grabbed without injection
- **Infrastructure in core logic** -- importing a database driver inside a business rule
- **Premature abstraction** -- don't create interfaces for things that will never have a second implementation
- **Inheritance for code reuse** -- prefer composition; inheritance couples you to the parent's internals

---

## Related Documents

- [Domain Model](./domain-model.md) - Complete entity specifications and database schema
- [Business Rules](./business-rules.md) - Business logic and workflows
- [Code Standards](./code-standards.md) - Naming conventions and style guide
- [Testing](./testing.md) - Testing philosophy and strategy
- [Roadmap](../plans/roadmap.md) - Feature implementation timeline
- [ADRs](../plans/decisions/) - All architecture decision records
