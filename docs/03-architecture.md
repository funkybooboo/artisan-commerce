# Architecture

This document covers how to think about structuring Artisan Commerce -- the principles that lead to code that is easy to test, change, and understand. These ideas apply regardless of language, framework, or project type.

**Note:** The specific technology stack will be determined in a future architecture decision record. This document focuses on architectural principles that will guide implementation regardless of the chosen technologies.

---

## Domain Model

Artisan Commerce is built around these core entities:

- **User** -- Customers and artisans with role-based permissions
- **Project** -- Made-to-order handmade items (crochet, knitting, embroidery, etc.) with customizable options
- **Pattern** -- Digital or physical patterns that can be sold standalone or linked to projects
- **Order** -- Customer orders containing projects and/or patterns, with lifecycle states and queue position
- **Queue** -- Central production capacity management system that calculates delivery estimates
- **Merch** -- Brand merchandise with traditional inventory management (separate from handmade queue)

The queue system is the core differentiator -- it manages finite production capacity and provides transparent delivery estimates.

---

## The Core Principle: Separate What from How

The most important architectural decision you will make is where to draw the line between **core logic** and **infrastructure**.

- **Core logic** is *what* your program does -- the rules, decisions, and transformations that make it valuable.
- **Infrastructure** is *how* it does it -- files, networks, databases, terminals, hardware, external services.

Core logic should not know about infrastructure. Infrastructure should be swappable without touching core logic.

---

## Ports and Adapters

One proven way to enforce this separation: define **ports** (interfaces that describe what your core needs) and implement **adapters** (concrete implementations that satisfy those interfaces).

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

**A port** is an interface -- a contract that describes a capability your core needs, without specifying how it's provided.

**An adapter** is a concrete implementation of a port. You can have multiple adapters for the same port:

| Port | Production adapter | Test adapter |
|------|--------------------|--------------|
| Storage | Database | In-memory map |
| Logger | Structured JSON | Silent / recording |
| Clock | System time | Fixed / controllable |
| Config | Environment vars | Hardcoded map |
| Notifier | Email service | Recording (captures calls) |
| PaymentProcessor | Stripe | Mock/recording |
| QueueCalculator | Production algorithm | Controllable/predictable |

For Artisan Commerce specifically:

- **PaymentProcessor** handles Stripe integration for checkout and refunds
- **Notifier** sends order confirmations, queue updates, and shipping notifications
- **QueueCalculator** implements the capacity management algorithm
- **Storage** manages users, projects, patterns, orders, and queue state

This pattern is sometimes called Hexagonal Architecture or Clean Architecture. The name doesn't matter. The idea does: **keep your core logic independent of the outside world.**

---

## Dependency Injection

Adapters need to be wired together somewhere. Do it in one place -- a composition root, a container, or your `main` entry point.

```
main / container
  |-- creates Config  (reads from environment)
  |-- creates Logger  (uses Config for log level)
  |-- creates Storage (uses Config for connection string)
  `-- creates App     (receives Storage, Logger -- knows nothing about how they work)
```

**Rules:**
- Construct dependencies once, at startup
- Pass them in -- don't reach out and grab them from globals
- The composition root is the only place that knows which concrete adapter is used

---

## 12-Factor Principles

Regardless of project type, these principles lead to software that is portable, maintainable, and honest:

1. **Config in the environment** -- no hardcoded values; read from env vars, flags, or config files; never commit secrets
2. **Explicit dependencies** -- declare everything; don't rely on ambient globals or system-installed tools
3. **Stateless processes** -- don't store state in memory between invocations; state belongs in storage
4. **Logs to stdout** -- write log output as a stream of events; let the environment handle routing
5. **One codebase, many environments** -- the same code runs in dev, test, and production; only config changes

See [12factor.net](https://12factor.net/) for the full list.

---

## Architecture Decision Records

When you make a significant architectural decision, document it. Future contributors -- including yourself -- will want to know why things are the way they are.

ADRs live in [`plans/decisions/`](../plans/decisions/). See the [README there](../plans/decisions/README.md) for the template and naming convention.

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

## Technology Stack

Artisan Commerce is built on a modern serverless edge architecture optimized for cost, portability, and AI-assisted development.

**Core Technologies:**
- **Frontend**: SvelteKit with TypeScript
- **Backend**: Hono on Cloudflare Workers (serverless functions)
- **Database**: Drizzle ORM + Cloudflare D1 (distributed SQLite)
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Infrastructure**: Terraform (Infrastructure as Code)
- **CI/CD**: GitHub Actions with SLSA Level 3 provenance
- **Testing**: TDD with Vitest + Playwright
- **Package Manager**: mise-managed dependencies

**Monthly Cost**: ~$1-5 (domain + transaction fees) - everything else runs on free tiers.

**Design Principles**:
- **Cheap**: Stay on free tiers, transaction-based pricing only
- **Convenient**: Maximum artisan UX, passwordless auth, modern DX
- **Secure**: Geographic + role + rate limiting, WCAG 2.1 AA, SLSA Level 3
- **Portable**: Zero vendor lock-in via comprehensive adapter pattern
- **Simple**: Prioritize clarity and maintainability over complexity

These choices follow the architectural principles above (ports/adapters, 12-factor, dependency injection) and are optimized for:
- Low traffic (<100 orders/month initially)
- Minimal operational overhead (fully managed services)
- Cost efficiency (free tiers cover 100x expected usage)
- Infrastructure as Code (everything version-controlled)
- Single-tenant-per-instance (one artisan business per deployment)
- Developer simplicity (SvelteKit's straightforward mental model)

**For detailed information:**
- [Tech Stack Summary](./developer/tech-stack.md) - Quick reference and architecture overview
- [Comprehensive Roadmap](../plans/ROADMAP-COMPREHENSIVE.md) - All decisions and milestones
- [ADR-002: Technology Stack](../plans/decisions/ADR-002-tech-stack.md) - Detailed decision rationale
- [ADR-003: Infrastructure as Code](../plans/decisions/ADR-003-infrastructure-as-code.md) - IaC approach
- [ADR-004: Database Choice](../plans/decisions/ADR-004-database-cloudflare-d1.md) - Database decision
- [ADR-005: Adapter Architecture](../plans/decisions/ADR-005-adapter-architecture.md) - Zero vendor lock-in
- [ADR-006: SvelteKit](../plans/decisions/ADR-006-nextjs-app-router.md) - Frontend framework choice
