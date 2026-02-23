# Developer Guides

Operational guides and technical documentation for developers working on Artisan Commerce.

These guides cover the practical aspects of development: setup, testing, deployment, and working with the technology stack. For architectural principles and development standards, see the [numbered documentation series](../).

---

## Getting Started

| Guide | What it covers |
|-------|----------------|
| [Local Development](./local-development.md) | Complete setup, workflow, testing, debugging, and troubleshooting |
| [Tech Stack Summary](./tech-stack.md) | Quick reference for all technology decisions and architecture |

**New to the project?** Start with [Local Development](./local-development.md) for a comprehensive setup guide.

---

## Operations

| Guide | What it covers |
|-------|----------------|
| [Deployment](./deployment.md) | CI/CD pipelines, staging/production deployment, rollback procedures, and monitoring |

---

## Core Systems

Technical documentation for the major systems in Artisan Commerce:

### Queue Management
- **Queue Calculation Algorithm** - How delivery estimates are calculated based on capacity
- **Capacity Management** - Setting and adjusting production throughput
- **Queue Weight System** - How different projects impact the queue differently

### Pricing Engine
- **Pricing Rules** - How material, color, and size options affect price
- **Price Calculation** - Composable pricing rules and modifiers
- **Historical Pricing** - Preserving prices at time of purchase

### Payment Processing
- **Stripe Integration** - Checkout flow and webhook handling
- **Refund Logic** - Cancellation fees and refund calculations
- **Payment Security** - PCI compliance and data handling

### Order Lifecycle
- **State Machine** - Order states from pending to delivered
- **Modification Windows** - Time-based rules for changes and cancellations
- **Email Notifications** - Triggered emails for order events

### User Roles & Permissions
- **Role-Based Access Control** - User, Admin, SuperAdmin capabilities
- **Admin Dashboard** - Queue management and order processing
- **SuperAdmin Tools** - System configuration and analytics

---

## Architecture Decisions

All major technology and architecture decisions are documented as ADRs (Architecture Decision Records) in [`plans/decisions/`](../../plans/decisions/):

- [ADR-001: Queue-Based Capacity Management](../../plans/decisions/ADR-001-example.md)
- [ADR-002: Technology Stack](../../plans/decisions/ADR-002-tech-stack.md)
- [ADR-003: Infrastructure as Code](../../plans/decisions/ADR-003-infrastructure-as-code.md)
- [ADR-004: Database Choice](../../plans/decisions/ADR-004-database-cloudflare-d1.md)

---

## Related Documentation

### Development Principles
- [Architecture Principles](../03-architecture.md) - Ports/adapters, 12-factor, separation of concerns
- [Code Standards](../04-code-standards.md) - Naming, style, error handling
- [Testing Philosophy](../05-testing.md) - TDD, testing pyramid, no-mocks policy
- [Git Workflow](../07-git-workflow.md) - Branching, commits, pull requests

### Planning
- [Roadmap](../../plans/roadmap.md) - What we're building and when
- [Vision](../../plans/vision.md) - Long-term goals and product direction

---

## Writing Developer Guides

When creating new developer guides:

- Write for someone who will read or modify the source code
- Explain the *why* behind design decisions, not just the *what*
- Document edge cases and error handling explicitly
- Include the testing strategy: which test files cover this feature
- Link to relevant ADRs if a significant decision was made

Add a file here for any feature complex enough to warrant explanation beyond inline comments.  
Name files after the feature: `queue-algorithm.md`, `pricing-engine.md`, `order-state-machine.md`.

---

> All documentation is plain text (Markdown), version controlled, and reviewed in pull requests.  
> Update docs in the same PR as the code they describe.
